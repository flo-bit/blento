import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { canStorePage, pageCacheKey, resolvePublicPage } from './public-page-cache';

function event(
	headers: HeadersInit = {},
	path = '/',
	route = '/[[actor=actor]]/(pages)'
): RequestEvent {
	const request = new Request(`https://blento.app${path}`, {
		headers: { accept: 'text/html', ...headers }
	});
	return {
		request,
		url: new URL(request.url),
		route: { id: route },
		locals: { did: null },
		isDataRequest: false,
		isSubRequest: false
	} as RequestEvent;
}
function html(body = 'public', extra: HeadersInit = {}) {
	return new Response(body, {
		headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, s-maxage=60', ...extra }
	});
}

describe('public page cache eligibility', () => {
	it('separates original domains, incoming hostnames, paths and HTML', () => {
		const a = pageCacheKey(event({ 'X-Custom-Domain': 'one.example' }))!;
		const b = pageCacheKey(event({ 'X-Custom-Domain': 'two.example' }))!;
		expect(a.url).not.toBe(b.url);
		expect(a.url).not.toBe(pageCacheKey(event())!.url);
		expect(pageCacheKey(event({}, '/alice.test'))!.url).not.toBe(pageCacheKey(event())!.url);
		const otherHost = event();
		otherHost.url = new URL('https://staging.blento.app/');
		otherHost.request = new Request(otherHost.url, { headers: { accept: 'text/html' } });
		expect(pageCacheKey(otherHost)!.url).not.toBe(pageCacheKey(event())!.url);
	});

	it.each(['cookie', 'authorization', 'range'])('bypasses %s', (header) => {
		expect(pageCacheKey(event({ [header]: 'value' }))).toBeUndefined();
	});
	it('bypasses auth, mutations, queries, data requests, invalid domains and interactive routes', () => {
		const auth = event();
		auth.locals.did = 'did:plc:example';
		expect(pageCacheKey(auth)).toBeUndefined();
		const post = event();
		post.request = new Request(post.url, { method: 'POST' });
		expect(pageCacheKey(post)).toBeUndefined();
		const data = event();
		data.isDataRequest = true;
		expect(pageCacheKey(data)).toBeUndefined();
		expect(pageCacheKey(event({}, '/?og-render=1'))).toBeUndefined();
		expect(pageCacheKey(event({ 'X-Custom-Domain': 'one.example,two.example' }))).toBeUndefined();
		expect(pageCacheKey(event({}, '/edit', '/[[actor=actor]]/(pages)/edit'))).toBeUndefined();
		expect(pageCacheKey(event({ accept: 'application/json' }))).toBeUndefined();
	});
	it('refuses cookies, private responses, non-HTML and unexpected Vary', () => {
		expect(canStorePage(html())).toBe(true);
		const unsafeHeaders: HeadersInit[] = [
			{ 'Set-Cookie': 'did=secret' },
			{ 'Cache-Control': 'private, no-store' },
			{ Vary: 'Cookie' },
			{ 'Content-Type': 'application/json' }
		];
		for (const headers of unsafeHeaders) {
			expect(canStorePage(html('sensitive', headers))).toBe(false);
		}
	});
});

describe('public page cache reads and concurrent misses', () => {
	it('uses independently consumable streams for coalesced public responses', async () => {
		const e = event({}, '/coalesced.test');
		const match = vi.fn(async () => undefined),
			put = vi.fn(async () => {});
		e.platform = { caches: { default: { match, put } } } as unknown as App.Platform;
		const render = vi.fn(async () => {
			await new Promise((r) => setTimeout(r, 5));
			return html();
		});
		const responses = await Promise.all(
			Array.from({ length: 10 }, () => resolvePublicPage(e, render))
		);
		expect(await Promise.all(responses.map((r) => r.text()))).toEqual(Array(10).fill('public'));
		expect(render).toHaveBeenCalledTimes(1);
		expect(put).toHaveBeenCalledTimes(1);
	});
	it('never shares unexpected Set-Cookie responses; renders once per caller', async () => {
		const e = event({}, '/cookie-response.test');
		e.platform = {
			caches: { default: { match: async () => undefined, put: vi.fn() } }
		} as unknown as App.Platform;
		let count = 0;
		const render = vi.fn(async () => {
			const n = ++count;
			await new Promise((r) => setTimeout(r, 5));
			return html(String(n), { 'Set-Cookie': `id=${n}` });
		});
		const responses = await Promise.all([
			resolvePublicPage(e, render),
			resolvePublicPage(e, render)
		]);
		expect(await Promise.all(responses.map((r) => r.text()))).toEqual(['1', '2']);
		expect(render).toHaveBeenCalledTimes(2);
	});
	it('makes cookie-bearing responses private even if the anonymous layout marks them public', async () => {
		const e = event({ Cookie: 'harmless=1' });
		const response = await resolvePublicPage(e, async () => html());
		expect(response.headers.get('Cache-Control')).toBe('private, no-store');
	});
	it('allows generic browser/crawler accepts, but not JSON-only responses', () => {
		expect(pageCacheKey(event({ accept: '*/*' }))).toBeDefined();
		expect(pageCacheKey(event({ accept: 'application/json' }))).toBeUndefined();
	});
	it('returns a cache hit without SSR', async () => {
		const e = event();
		e.platform = {
			caches: { default: { match: async () => html('cached') } }
		} as unknown as App.Platform;
		const render = vi.fn();
		const response = await resolvePublicPage(e, render);
		expect(response.headers.get('X-Blento-Cache')).toBe('HIT');
		expect(await response.text()).toBe('cached');
		expect(render).not.toHaveBeenCalled();
	});
});
