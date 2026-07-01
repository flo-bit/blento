import { describe, it, expect } from 'vitest';
import { resolve, resolveGraph } from './resolve.js';
import { MemoryCacheAdapter } from './cache.js';
import type { Source, SourceContext } from './types.js';
import { fakeFetch } from './testutil.js';

const atproto = (params: Record<string, unknown>): Source => ({
	$type: 'app.blento.source#atproto',
	method: 'app.bsky.feed.getAuthorFeed',
	params
});

describe('#custom (stub)', () => {
	it('throws not-implemented', async () => {
		const s: Source = { $type: 'app.blento.source#custom', loader: 'x' };
		await expect(resolve(s, { self: 'x' })).rejects.toThrow(/not implemented/);
	});
});

describe('lone #ref', () => {
	it('cannot be resolved directly', async () => {
		const s: Source = { $type: 'app.blento.source#ref', node: 'owner' };
		await expect(resolve(s, { self: 'x' })).rejects.toThrow(/resolveGraph/);
	});
});

describe('resolveGraph', () => {
	const ctx = (fetchImpl: typeof fetch): SourceContext => ({ self: 'did:plc:aaa', fetchImpl });

	it('aliases #ref nodes to the owner result and dedupes identical inline sources', async () => {
		const ff = fakeFetch([{ match: 'getAuthorFeed', body: { feed: ['post'], cursor: 'z' } }]);
		const nodes = [
			{ id: 'owner', source: atproto({ actor: '$self' }) },
			// identical spec to owner → should dedupe to a single fetch
			{ id: 'twin', source: atproto({ actor: '$self' }) },
			{ id: 'ref', source: { $type: 'app.blento.source#ref', node: 'owner' } as Source },
			{ id: 'plain', source: undefined }
		];

		const cache = new MemoryCacheAdapter();
		const out = await resolveGraph(nodes, ctx(ff.fetch), { cache });

		expect(out.owner).toEqual({ data: { feed: ['post'], cursor: 'z' }, nextCursor: 'z' });
		expect(out.ref).toEqual(out.owner);
		expect(out.twin).toEqual(out.owner);
		expect(out.plain).toBeUndefined();
		// owner + twin share a cache key → exactly one network fetch
		expect(ff.calls.length).toBe(1);
	});

	it('yields null for a #ref to a non-source / missing owner', async () => {
		const ff = fakeFetch([{ match: 'getAuthorFeed', body: { feed: [] } }]);
		const nodes = [
			{ id: 'plain', source: undefined },
			{ id: 'refToPlain', source: { $type: 'app.blento.source#ref', node: 'plain' } as Source },
			{ id: 'refToMissing', source: { $type: 'app.blento.source#ref', node: 'nope' } as Source }
		];
		const out = await resolveGraph(nodes, ctx(ff.fetch));
		expect(out.refToPlain).toBeNull();
		expect(out.refToMissing).toBeNull();
	});

	it('disallows ref→ref chains', async () => {
		const ff = fakeFetch([{ match: 'getAuthorFeed', body: { feed: [] } }]);
		const nodes = [
			{ id: 'owner', source: atproto({ actor: '$self' }) },
			{ id: 'r1', source: { $type: 'app.blento.source#ref', node: 'owner' } as Source },
			{ id: 'r2', source: { $type: 'app.blento.source#ref', node: 'r1' } as Source }
		];
		await expect(resolveGraph(nodes, ctx(ff.fetch))).rejects.toThrow(/#ref chain/);
	});

	it('isolates a failing source to null without failing the whole graph', async () => {
		const ff = fakeFetch([{ match: 'getAuthorFeed', body: { error: 'boom' }, status: 500 }]);
		const nodes = [{ id: 'bad', source: atproto({ actor: '$self' }) }];
		const out = await resolveGraph(nodes, ctx(ff.fetch));
		expect(out.bad).toBeNull();
	});
});
