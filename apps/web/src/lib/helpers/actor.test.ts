import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DidNotFoundError } from '@atcute/identity-resolver';

const { resolveHandle } = vi.hoisted(() => ({ resolveHandle: vi.fn() }));
vi.mock('$lib/atproto', () => ({ resolveHandle }));
vi.mock('./moderation', () => ({ isDidBlocked: () => false }));
vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_HANDLE: 'blento.app' } }));

beforeEach(() => {
	vi.resetModules();
	resolveHandle.mockReset();
});
const request = new Request('https://blento.app/actor.test');

describe('bounded actor resolution caching', () => {
	it('coalesces simultaneous resolution and reuses successful handles', async () => {
		const { getActor } = await import('./actor');
		resolveHandle.mockResolvedValue('did:plc:test');
		const values = await Promise.all(
			Array.from({ length: 10 }, () =>
				getActor({ request, paramActor: 'actor.test', platform: undefined })
			)
		);
		expect(values).toEqual(Array(10).fill('did:plc:test'));
		expect(resolveHandle).toHaveBeenCalledTimes(1);
	});
	it('briefly caches definitive nonexistent handles', async () => {
		const { getActor } = await import('./actor');
		resolveHandle.mockRejectedValue(new DidNotFoundError('missing.test'));
		for (let i = 0; i < 2; i++)
			expect(
				await getActor({ request, paramActor: 'missing.test', platform: undefined })
			).toBeUndefined();
		expect(resolveHandle).toHaveBeenCalledTimes(1);
	});
	it('does not cache transient errors as nonexistence', async () => {
		const { getActor } = await import('./actor');
		resolveHandle
			.mockRejectedValueOnce(new Error('network failure'))
			.mockResolvedValue('did:plc:available');
		await expect(
			getActor({ request, paramActor: 'actor.test', platform: undefined })
		).rejects.toThrow('network failure');
		expect(await getActor({ request, paramActor: 'actor.test', platform: undefined })).toBe(
			'did:plc:available'
		);
		expect(resolveHandle).toHaveBeenCalledTimes(2);
	});
	it('preserves per-domain actor lookup and never resolves a supplied DID remotely', async () => {
		const { getActor } = await import('./actor');
		const kv = {
			get: vi.fn(async (domain: string) =>
				domain === 'one.example' ? 'did:plc:one' : 'did:plc:two'
			)
		};
		const platform = { env: { CUSTOM_DOMAINS: kv } } as unknown as App.Platform;
		for (const domain of ['one.example', 'two.example']) {
			const forwarded = new Request(request, { headers: { 'X-Custom-Domain': domain } });
			expect(await getActor({ request: forwarded, platform })).toBe(
				domain === 'one.example' ? 'did:plc:one' : 'did:plc:two'
			);
		}
		expect(await getActor({ request, paramActor: 'did:plc:test', platform: undefined })).toBe(
			'did:plc:test'
		);
		expect(resolveHandle).not.toHaveBeenCalled();
	});
});
