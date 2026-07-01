/**
 * Enumerate live blento sites — the diff oracle's subject list (plan §9).
 *
 * Uses the same source as v1's "Updated Blentos" card: the production contrail XRPC
 * `app.blento.card.listRecords` cross-actor (no `actor` param), recency-sorted, paginated by
 * `cursor`. We dedupe DIDs and pull handles from the `profiles` side-channel.
 */
export interface SiteRef {
	did: string;
	handle?: string;
}

interface ListResp {
	records: Array<{ did: string }>;
	cursor?: string;
	profiles?: Array<{ did: string; handle?: string }>;
}

export interface ListSitesOptions {
	origin?: string;
	/** Cap on unique sites returned (default: all). */
	maxSites?: number;
	/** Records per request (default 200). */
	pageSize?: number;
	/** Safety cap on pagination requests (default 500). */
	maxRequests?: number;
}

const isJunk = (s: string) => s.endsWith('.pds.rip') || s === 'handle.invalid';

export async function listSites(opts: ListSitesOptions = {}): Promise<SiteRef[]> {
	const origin = opts.origin ?? process.env.DIFF_LIVE_ORIGIN ?? 'https://blento.app';
	const pageSize = opts.pageSize ?? 200;
	const maxSites = opts.maxSites ?? Infinity;
	const maxRequests = opts.maxRequests ?? 500;

	const handles = new Map<string, string>();
	const order: string[] = [];
	const seen = new Set<string>();
	let cursor: string | undefined;

	for (let req = 0; req < maxRequests; req++) {
		const url = new URL(`${origin}/xrpc/app.blento.card.listRecords`);
		url.searchParams.set('limit', String(pageSize));
		url.searchParams.set('profiles', 'true');
		url.searchParams.set('sort', 'time_us');
		url.searchParams.set('order', 'desc');
		if (cursor) url.searchParams.set('cursor', cursor);

		const res = await fetch(url, { headers: { 'user-agent': 'blento-diff-harness' } });
		if (!res.ok) throw new Error(`listRecords ${res.status} on request ${req}`);
		const data = (await res.json()) as ListResp;

		for (const p of data.profiles ?? []) {
			if (p.handle && !isJunk(p.handle)) handles.set(p.did, p.handle);
		}
		for (const r of data.records) {
			if (seen.has(r.did) || isJunk(r.did)) continue;
			seen.add(r.did);
			order.push(r.did);
			if (order.length >= maxSites) break;
		}

		if (order.length >= maxSites) break;
		cursor = data.cursor;
		if (!cursor || data.records.length === 0) break;
	}

	return order.map((did) => ({ did, handle: handles.get(did) }));
}

// CLI: `tsx sites.ts` → prints JSON to stdout (MAX_SITES env caps the count).
if (import.meta.url === `file://${process.argv[1]}`) {
	const max = process.env.MAX_SITES ? Number(process.env.MAX_SITES) : undefined;
	const sites = await listSites({ maxSites: max });
	console.error(`enumerated ${sites.length} sites`);
	process.stdout.write(JSON.stringify(sites, null, 2) + '\n');
}
