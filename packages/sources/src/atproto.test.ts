import { describe, it, expect } from 'vitest';
import { resolve } from './resolve.js';
import type { Source, SourceContext } from './types.js';
import { fakeFetch } from './testutil.js';

const SELF = 'did:plc:s42iw2fbfmgsgh7hdtvvoaao';

describe('#atproto', () => {
	it('substitutes $self and hits the default appview for a bsky method', async () => {
		const ff = fakeFetch([
			{ match: 'app.bsky.feed.getAuthorFeed', body: { feed: [], cursor: 'c1' } }
		]);
		const source: Source = {
			$type: 'app.blento.source#atproto',
			method: 'app.bsky.feed.getAuthorFeed',
			params: { actor: '$self', filter: 'posts_no_replies', limit: 2 }
		};
		const ctx: SourceContext = { self: SELF, fetchImpl: ff.fetch };

		const res = await resolve(source, ctx);

		expect(res).toEqual({ data: { feed: [], cursor: 'c1' }, nextCursor: 'c1' });
		const url = ff.calls[0].url;
		expect(url).toContain('https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed');
		expect(url).toContain(`actor=${encodeURIComponent(SELF)}`);
		expect(url).toContain('filter=posts_no_replies');
		expect(url).toContain('limit=2');
	});

	it('substitutes $self inside a longer string (at-uri)', async () => {
		const ff = fakeFetch([{ match: 'com.atproto.repo.listRecords', body: { records: [] } }]);
		// listRecords is repo.* → PDS path; needs did→PDS resolution first
		const withPds = fakeFetch([
			{
				match: 'plc.directory',
				body: { service: [{ id: '#atproto_pds', serviceEndpoint: 'https://pds.example' }] }
			},
			{ match: 'com.atproto.repo.listRecords', body: { records: [], cursor: undefined } }
		]);
		const source: Source = {
			$type: 'app.blento.source#atproto',
			method: 'com.atproto.repo.listRecords',
			params: { repo: '$self', collection: 'app.blento.card', uri: 'at://$self/x' }
		};
		await resolve(source, { self: SELF, fetchImpl: withPds.fetch });
		const call = withPds.calls.find((c) => c.url.includes('listRecords'))!;
		expect(call.url).toContain('https://pds.example/xrpc/com.atproto.repo.listRecords');
		expect(call.url).toContain(`repo=${encodeURIComponent(SELF)}`);
		expect(call.url).toContain(encodeURIComponent(`at://${SELF}/x`));
		expect(ff.calls.length).toBe(0);
	});

	it('routes repo.* / sync.* to the actor PDS resolved via plc.directory', async () => {
		const ff = fakeFetch([
			{
				match: 'plc.directory',
				body: { service: [{ id: '#atproto_pds', serviceEndpoint: 'https://pds.host' }] }
			},
			{ match: 'com.atproto.sync.getRepo', body: { ok: true } }
		]);
		const source: Source = {
			$type: 'app.blento.source#atproto',
			method: 'com.atproto.sync.getRepo',
			params: { did: '$self' }
		};
		await resolve(source, { self: SELF, fetchImpl: ff.fetch });
		expect(ff.calls[0].url).toBe(`https://plc.directory/${SELF}`);
		expect(ff.calls[1].url).toContain('https://pds.host/xrpc/com.atproto.sync.getRepo');
	});

	it('uses an explicit service only when allow-listed', async () => {
		const ff = fakeFetch([{ match: 'my.appview', body: { data: 1 } }]);
		const source: Source = {
			$type: 'app.blento.source#atproto',
			method: 'app.example.getThing',
			service: 'https://my.appview',
			params: {}
		};
		// not allow-listed → refuse
		await expect(resolve(source, { self: SELF, fetchImpl: ff.fetch })).rejects.toThrow(
			/not allow-listed/
		);
		// allow-listed via ctx.appviews → ok
		const res = await resolve(source, {
			self: SELF,
			fetchImpl: ff.fetch,
			appviews: ['https://my.appview']
		});
		expect(res.data).toEqual({ data: 1 });
	});

	it('threads cursor in and reports nextCursor out', async () => {
		const ff = fakeFetch([{ match: 'getAuthorFeed', body: { feed: [1], cursor: 'next' } }]);
		const source: Source = {
			$type: 'app.blento.source#atproto',
			method: 'app.bsky.feed.getAuthorFeed',
			params: { actor: '$self' }
		};
		const res = await resolve(source, { self: SELF, fetchImpl: ff.fetch }, { cursor: 'page2' });
		expect(ff.calls[0].url).toContain('cursor=page2');
		expect(res.nextCursor).toBe('next');
	});
});
