import { describe, it, expect } from 'vitest';
import { cacheKey, MemoryCacheAdapter } from './cache.js';
import { resolve } from './resolve.js';
import type { Source, SourceContext } from './types.js';
import { fakeFetch } from './testutil.js';

describe('cache key', () => {
	it('is stable regardless of param key order', () => {
		const a: Source = {
			$type: 'app.blento.source#atproto',
			method: 'm',
			params: { a: 1, b: 2 }
		};
		const b: Source = {
			$type: 'app.blento.source#atproto',
			method: 'm',
			params: { b: 2, a: 1 }
		};
		expect(cacheKey(a)).toBe(cacheKey(b));
	});

	it('differs by cursor and by spec', () => {
		const s: Source = { $type: 'app.blento.source#atproto', method: 'm', params: { x: 1 } };
		const s2: Source = { $type: 'app.blento.source#atproto', method: 'm', params: { x: 2 } };
		expect(cacheKey(s, 'c1')).not.toBe(cacheKey(s, 'c2'));
		expect(cacheKey(s)).not.toBe(cacheKey(s2));
	});
});

describe('resolve caching', () => {
	it('serves the second call from cache (no second fetch)', async () => {
		const ff = fakeFetch([{ match: 'getAuthorFeed', body: { feed: [1] } }]);
		const source: Source = {
			$type: 'app.blento.source#atproto',
			method: 'app.bsky.feed.getAuthorFeed',
			params: { actor: '$self' }
		};
		const ctx: SourceContext = { self: 'did:plc:aaa', fetchImpl: ff.fetch };
		const cache = new MemoryCacheAdapter();

		const r1 = await resolve(source, ctx, { cache });
		const r2 = await resolve(source, ctx, { cache });

		expect(r1).toEqual(r2);
		expect(ff.calls.length).toBe(1);
		expect(cache.size).toBe(1);
	});

	it('keys by resolved spec: different $self → different entries', async () => {
		const ff = fakeFetch([{ match: 'getAuthorFeed', body: { feed: [] } }]);
		const source: Source = {
			$type: 'app.blento.source#atproto',
			method: 'app.bsky.feed.getAuthorFeed',
			params: { actor: '$self' }
		};
		const cache = new MemoryCacheAdapter();
		await resolve(source, { self: 'did:plc:aaa', fetchImpl: ff.fetch }, { cache });
		await resolve(source, { self: 'did:plc:bbb', fetchImpl: ff.fetch }, { cache });
		expect(cache.size).toBe(2);
		expect(ff.calls.length).toBe(2);
	});
});
