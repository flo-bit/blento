import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

const mocks = vi.hoisted(() => ({
	getActor: vi.fn(),
	readOgImage: vi.fn(),
	reserveScreenshot: vi.fn(),
	releaseScreenshot: vi.fn()
}));
vi.mock('./actor', () => ({ getActor: mocks.getActor }));
vi.mock('./og-storage', () => ({
	readOgImage: mocks.readOgImage,
	ogObjectKey: (a: string) => `og/v1/${a}`,
	MAX_OG_BYTES: 8 * 1024 * 1024
}));
vi.mock('./screenshot-budget', () => ({
	reserveScreenshot: mocks.reserveScreenshot,
	releaseScreenshot: mocks.releaseScreenshot
}));
vi.mock('$env/dynamic/private', () => ({
	env: { CLOUDFLARE_ACCOUNT_ID: 'test', CLOUDFLARE_API_TOKEN: 'test' }
}));
vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_DOMAIN: 'https://blento.app' } }));
import { GET, POST } from '../../routes/[[actor=actor]]/og-new.png/+server';

type RouteEvent = Parameters<typeof POST>[0];
function event(owner = false, origin = 'https://blento.app'): RouteEvent {
	return {
		params: { actor: 'did:plc:test' },
		request: new Request('https://blento.app/did:plc:test/og-new.png', {
			method: owner ? 'POST' : 'GET',
			headers: { origin }
		}),
		locals: { did: owner ? 'did:plc:test' : null },
		platform: {
			env: { DB: {}, OG_IMAGES: { put: vi.fn() }, USER_DATA_CACHE: { delete: vi.fn() } },
			context: { waitUntil: vi.fn() }
		}
	} as unknown as RequestEvent as RouteEvent;
}
beforeEach(() => {
	vi.resetAllMocks();
	mocks.getActor.mockResolvedValue('did:plc:test');
	mocks.readOgImage.mockResolvedValue(undefined);
	mocks.releaseScreenshot.mockResolvedValue(undefined);
	vi.stubGlobal('fetch', vi.fn());
});

describe('screenshot public and owner boundaries', () => {
	it('never generates on a public cache miss, even for distinct actors', async () => {
		for (let i = 0; i < 25; i++) {
			mocks.getActor.mockResolvedValue(`did:plc:${i}`);
			const response = await GET(event());
			expect(response.status).toBe(302);
			expect(response.headers.get('Location')).toBe('/og-default.png');
		}
		expect(fetch).not.toHaveBeenCalled();
		expect(mocks.reserveScreenshot).not.toHaveBeenCalled();
	});
	it('serves existing bytes without generation', async () => {
		mocks.readOgImage.mockResolvedValue(new Uint8Array([1, 2]).buffer);
		const response = await GET(event());
		expect(response.status).toBe(200);
		expect(fetch).not.toHaveBeenCalled();
	});
	it('rejects anonymous, wrong-owner and cross-origin generation before budget writes', async () => {
		await expect(POST(event())).rejects.toMatchObject({ status: 401 });
		await expect(POST(event(true, 'https://evil.example'))).rejects.toMatchObject({ status: 403 });
		const other = event(true);
		other.locals.did = 'did:plc:other';
		await expect(POST(other)).rejects.toMatchObject({ status: 403 });
		expect(mocks.reserveScreenshot).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});
	it('does not generate or delete an old image when budget is exhausted', async () => {
		const e = event(true);
		const response = await POST(e);
		expect(response.status).toBe(429);
		expect(fetch).not.toHaveBeenCalled();
		expect(e.platform!.env.USER_DATA_CACHE.delete).not.toHaveBeenCalled();
	});
	it('persists a successful render and ties generation to waitUntil', async () => {
		mocks.reserveScreenshot.mockResolvedValue('lease');
		vi.mocked(fetch).mockResolvedValue(
			new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))
		);
		const e = event(true);
		const response = await POST(e);
		expect(response.status).toBe(200);
		expect(e.platform!.env.OG_IMAGES!.put).toHaveBeenCalledTimes(1);
		expect(e.platform!.context.waitUntil).toHaveBeenCalledTimes(1);
		expect(mocks.releaseScreenshot).toHaveBeenCalledWith(e.platform!.env.DB, 'lease');
	});
	it('does not replace the last image after a failed render', async () => {
		mocks.reserveScreenshot.mockResolvedValue('lease');
		vi.mocked(fetch).mockResolvedValue(new Response('failed', { status: 502 }));
		const e = event(true);
		expect((await POST(e)).status).toBe(502);
		expect(e.platform!.env.OG_IMAGES!.put).not.toHaveBeenCalled();
		expect(e.platform!.env.USER_DATA_CACHE.delete).not.toHaveBeenCalled();
		expect(mocks.releaseScreenshot).toHaveBeenCalledTimes(1);
	});
});
