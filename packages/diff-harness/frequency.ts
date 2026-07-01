/**
 * Card-type frequency across the network — drives the port priority. Paginates the cross-actor
 * `app.blento.card.listRecords` and tallies `cardType`, so we port the ~10 types that cover most
 * content rather than all 67. Also reports how many sites use each type.
 */
const origin = process.env.DIFF_LIVE_ORIGIN ?? 'https://blento.app';
const maxRequests = process.env.MAX_REQUESTS ? Number(process.env.MAX_REQUESTS) : 80;

const cardCount = new Map<string, number>();
const siteSet = new Map<string, Set<string>>(); // type -> set of dids
let cursor: string | undefined;
let total = 0;

for (let req = 0; req < maxRequests; req++) {
	const url = new URL(`${origin}/xrpc/app.blento.card.listRecords`);
	url.searchParams.set('limit', '200');
	url.searchParams.set('sort', 'time_us');
	url.searchParams.set('order', 'desc');
	if (cursor) url.searchParams.set('cursor', cursor);

	const res = await fetch(url, { headers: { 'user-agent': 'blento-diff-harness' } });
	if (!res.ok) break;
	const data = (await res.json()) as {
		records: Array<{ did: string; value: { cardType?: string } }>;
		cursor?: string;
	};

	for (const r of data.records) {
		const t = r.value?.cardType ?? 'unknown';
		cardCount.set(t, (cardCount.get(t) ?? 0) + 1);
		let s = siteSet.get(t);
		if (!s) {
			s = new Set();
			siteSet.set(t, s);
		}
		s.add(r.did);
		total++;
	}
	cursor = data.cursor;
	if (!cursor || data.records.length === 0) break;
}

const ported = new Set(['grid', 'link', 'text', 'image']);
const ranked = [...cardCount.entries()].sort((a, b) => b[1] - a[1]);

console.log(`sampled ${total} cards across ${new Set([...siteSet.values()].flatMap((s) => [...s])).size} sites\n`);
console.log('rank  cards  sites  type');
ranked.forEach(([type, n], i) => {
	const mark = ported.has(type) ? '✓' : ' ';
	console.log(
		`${String(i + 1).padStart(3)}  ${String(n).padStart(5)}  ${String(siteSet.get(type)!.size).padStart(5)}  ${mark} ${type}`
	);
});
