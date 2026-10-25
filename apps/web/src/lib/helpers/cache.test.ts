import { describe, expect, it, vi } from 'vitest';
import type { KVNamespace } from '@cloudflare/workers-types';
vi.mock('$lib/atproto/methods', () => ({ getBlentoOrBskyProfile: vi.fn() }));
import { CacheService } from './cache';

function namespace(initial: unknown = null) {
	let value = initial && JSON.stringify(initial);
	const get = vi.fn(async () => value);
	const put = vi.fn(async (_key: string, next: string) => {
		value = next;
	});
	return { kv: { get, put } as unknown as KVNamespace, put };
}

describe('SWR coalescing across request-local CacheService instances', () => {
	it('runs one loader and one write for concurrent misses', async () => {
		const { kv, put } = namespace();
		const loader = vi.fn(async () => {
			await new Promise((r) => setTimeout(r, 5));
			return 'fresh';
		});
		const results = await Promise.all(
			Array.from({ length: 20 }, () => new CacheService(kv).swr('rss', 'same', loader))
		);
		expect(results).toEqual(Array(20).fill('fresh'));
		expect(loader).toHaveBeenCalledTimes(1);
		expect(put).toHaveBeenCalledTimes(1);
	});

	it('returns stale data and attaches one refresh to request lifetimes', async () => {
		const { kv, put } = namespace({ staleAt: 0, value: 'old' });
		const work: Promise<unknown>[] = [];
		const loader = vi.fn(async () => {
			await new Promise((r) => setTimeout(r, 5));
			return 'new';
		});
		const values = await Promise.all(
			Array.from({ length: 20 }, () =>
				new CacheService(kv).swr('rss', 'same', loader, { waitUntil: (p) => work.push(p) })
			)
		);
		expect(values).toEqual(Array(20).fill('old'));
		await Promise.all(work);
		expect(loader).toHaveBeenCalledTimes(1);
		expect(put).toHaveBeenCalledTimes(1);
	});

	it('releases a rejected miss so a later request can retry', async () => {
		const { kv } = namespace();
		const loader = vi.fn().mockRejectedValueOnce(new Error('upstream')).mockResolvedValue('ok');
		const cache = new CacheService(kv);
		await expect(cache.swr('rss', 'failure', loader)).rejects.toThrow('upstream');
		await expect(cache.swr('rss', 'failure', loader)).resolves.toBe('ok');
	});

	it('never coalesces separate KV bindings', async () => {
		const a = namespace(),
			b = namespace();
		const values = await Promise.all([
			new CacheService(a.kv).swr('rss', 'same', async () => 'a'),
			new CacheService(b.kv).swr('rss', 'same', async () => 'b')
		]);
		expect(values).toEqual(['a', 'b']);
	});
});
