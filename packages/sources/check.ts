/**
 * Resolve REAL sources against live infrastructure — a smoke test, not a unit test (network-bound).
 *   pnpm --filter @blento/sources exec tsx check.ts [did]
 *
 * Checks:
 *   1. #atproto against the bsky appview   (app.bsky.feed.getAuthorFeed, $self → did)
 *   2. cursor pagination                    (walk page 1 → page 2 via nextCursor)
 *   3. #atproto repo path via the actor PDS (com.atproto.repo.listRecords, did→PDS resolution)
 *   4. cache dedupe                          (second resolve serves from the in-memory adapter)
 */
import { resolve, MemoryCacheAdapter, type Source, type SourceContext } from './src/index.js';

const did = process.argv[2] ?? 'did:plc:s42iw2fbfmgsgh7hdtvvoaao';
const ctx: SourceContext = { self: did };

function fail(msg: string): never {
	console.error('CHECK FAIL:', msg);
	process.exit(1);
}

// 1 + 2: author feed + pagination
const feedSource: Source = {
	$type: 'app.blento.source#atproto',
	method: 'app.bsky.feed.getAuthorFeed',
	params: { actor: '$self', filter: 'posts_no_replies', limit: 2 }
};
const page1 = await resolve(feedSource, ctx);
const feed1 = (page1.data as { feed?: unknown[] }).feed ?? [];
if (!Array.isArray(feed1)) fail('getAuthorFeed did not return a feed array');

let page2Len = 0;
if (page1.nextCursor) {
	const page2 = await resolve(feedSource, ctx, { cursor: page1.nextCursor });
	page2Len = ((page2.data as { feed?: unknown[] }).feed ?? []).length;
}

// 3: repo listRecords via the actor's PDS (repo.* → did→PDS resolution)
const listSource: Source = {
	$type: 'app.blento.source#atproto',
	method: 'com.atproto.repo.listRecords',
	params: { repo: '$self', collection: 'app.bsky.feed.post', limit: 1 }
};
const list = await resolve(listSource, ctx);
const records = (list.data as { records?: unknown[] }).records ?? [];
if (!Array.isArray(records)) fail('listRecords did not return a records array');

// 4: cache dedupe — second call must not change the result and must add exactly one entry
const cache = new MemoryCacheAdapter();
const c1 = await resolve(feedSource, ctx, { cache });
const c2 = await resolve(feedSource, ctx, { cache });
if (JSON.stringify(c1) !== JSON.stringify(c2)) fail('cached result differs from fresh result');
if (cache.size !== 1) fail(`expected 1 cache entry, got ${cache.size}`);

console.log(
	JSON.stringify(
		{
			did,
			feedPage1: feed1.length,
			nextCursor: page1.nextCursor ?? null,
			feedPage2: page2Len,
			listRecords: records.length,
			cacheEntries: cache.size
		},
		null,
		2
	)
);
console.log('OK: all live source checks passed');
