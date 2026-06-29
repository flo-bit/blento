/**
 * Validate migrateV1 + serialization against a real repo's LIVE records.
 *   pnpm --filter @blento/schema exec tsx check.ts [did]
 *
 * Fetches app.blento.card + app.blento.section from the actor's PDS, migrates per page, and asserts
 * the structural invariants (no orphan leaves, integer-only layout, unique sibling ranks, clean
 * record round-trip). Network-dependent, so it's a script, not part of the unit suite.
 */
import { migrateV1, type V1Card, type V1Section } from './src/migrate.js';
import { nodeToRecord, recordToNode } from './src/serialize.js';

const did = process.argv[2] ?? 'did:plc:s42iw2fbfmgsgh7hdtvvoaao';

async function resolvePds(did: string): Promise<string> {
	const r = await fetch(`https://plc.directory/${did}`);
	const doc: any = await r.json();
	const svc = (doc.service ?? []).find((s: any) => s.id === '#atproto_pds');
	if (!svc) throw new Error('no PDS in DID doc');
	return svc.serviceEndpoint;
}

async function listAll(pds: string, did: string, collection: string): Promise<any[]> {
	const out: any[] = [];
	let cursor: string | undefined;
	do {
		const url = new URL(`${pds}/xrpc/com.atproto.repo.listRecords`);
		url.searchParams.set('repo', did);
		url.searchParams.set('collection', collection);
		url.searchParams.set('limit', '100');
		if (cursor) url.searchParams.set('cursor', cursor);
		const r = await fetch(url);
		if (!r.ok) break;
		const data: any = await r.json();
		out.push(...(data.records ?? []));
		cursor = data.cursor;
	} while (cursor);
	return out;
}

const rkey = (uri: string) => uri.split('/').pop()!;
const normJson = (o: any) => JSON.stringify(o, Object.keys(o).sort());

const pds = await resolvePds(did);
const cardRecs = await listAll(pds, did, 'app.blento.card');
const sectionRecs = await listAll(pds, did, 'app.blento.section');
const cards: V1Card[] = cardRecs.map((r) => ({ id: rkey(r.uri), ...r.value }));
const sections: V1Section[] = sectionRecs.map((r) => ({ id: rkey(r.uri), ...r.value }));

// migrate per page (cards/sections partition by page key)
const pageKeys = [
	...new Set([...cards.map((c) => c.page ?? 'blento.self'), ...sections.map((s) => s.page)])
];
const nodes = pageKeys.flatMap((page) =>
	migrateV1(
		sections.filter((s) => s.page === page),
		cards.filter((c) => (c.page ?? 'blento.self') === page),
		page
	)
);

const ids = new Set(nodes.map((n) => n.id));
const leaves = nodes.filter((n) => n.kind === 'leaf');
const orphans = leaves.filter((n) => n.parent && !ids.has(n.parent));
const floats = nodes.filter(
	(n) =>
		n.layout &&
		Object.values(n.layout as Record<string, unknown>).some(
			(v) => typeof v === 'number' && !Number.isInteger(v)
		)
);
const rankDupes: string[] = [];
const seen = new Map<string, Set<string>>();
for (const n of nodes) {
	const k = n.parent ?? '__root__';
	const set = seen.get(k) ?? new Set<string>();
	if (set.has(n.rank)) rankDupes.push(`${k}:${n.rank}`);
	set.add(n.rank);
	seen.set(k, set);
}
const roundTripFail = nodes.filter(
	(n) => normJson(recordToNode(n.id, nodeToRecord(n))) !== normJson(n)
);

console.log(
	JSON.stringify(
		{
			did,
			pages: pageKeys.length,
			cards: cards.length,
			sections: sections.length,
			nodes: nodes.length,
			containers: nodes.filter((n) => n.kind === 'container').length,
			leaves: leaves.length,
			orphans: orphans.length,
			floats: floats.length,
			rankDupes: rankDupes.length,
			roundTripFail: roundTripFail.length
		},
		null,
		2
	)
);

if (orphans.length || floats.length || rankDupes.length || roundTripFail.length) {
	console.error('INVARIANT FAIL');
	process.exit(1);
}
console.log('OK: all invariants hold');
