/**
 * Back up every blento repo's records (and referenced blobs) to disk.
 *
 *   pnpm --filter @blento/backup start [outDir]
 *
 * Layout:
 *   <outDir>/<UTC-timestamp>/<did>/<collection>/<rkey>.json   — one JSON file per record
 *   <outDir>/<UTC-timestamp>/<did>/_blobs/<cid>               — every blob the records reference
 *
 * Repos are discovered with com.atproto.sync.listReposByCollection on a relay (the same mechanism
 * contrail uses to discover repos), unioned over the blento content collections — so it finds both
 * legacy (card) and migrated (node) users. Per-repo records come straight from each repo's PDS.
 *
 * Env:
 *   BLENTO_RELAY              relay host for discovery (default https://relay1.us-west.bsky.network)
 *   BLENTO_BACKUP_LIMIT       cap the number of repos (for a quick test run); default = all
 *   BLENTO_BACKUP_CONCURRENCY repos fetched in parallel (default 12)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const RELAY = process.env.BLENTO_RELAY ?? 'https://relay1.us-west.bsky.network';
const OUT_ROOT = process.argv[2] ?? './backups';
const LIMIT = process.env.BLENTO_BACKUP_LIMIT ? Number(process.env.BLENTO_BACKUP_LIMIT) : Infinity;
const CONCURRENCY = Number(process.env.BLENTO_BACKUP_CONCURRENCY ?? 12);

/** blento-owned records we preserve (content + legacy/new roots + pronouns). */
const COLLECTIONS = [
	'app.blento.node',
	'app.blento.card',
	'app.blento.section',
	'app.blento.page',
	'site.standard.publication',
	'app.nearhorizon.actor.pronouns'
];
/** collections used to discover which repos are blento users at all. */
const DISCOVERY_COLLECTIONS = ['app.blento.card', 'app.blento.node'];

interface JsonObject {
	[k: string]: unknown;
}

async function getJson(url: string | URL): Promise<unknown> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
	return res.json();
}

/** All DIDs that have at least one record in `collection`, via the relay. */
async function listReposByCollection(collection: string): Promise<string[]> {
	const dids: string[] = [];
	let cursor: string | undefined;
	do {
		const url = new URL(`${RELAY}/xrpc/com.atproto.sync.listReposByCollection`);
		url.searchParams.set('collection', collection);
		url.searchParams.set('limit', '500');
		if (cursor) url.searchParams.set('cursor', cursor);
		let data: { repos?: { did: string }[]; cursor?: string };
		try {
			data = (await getJson(url)) as typeof data;
		} catch (e) {
			console.warn(`  ! listReposByCollection(${collection}) failed: ${(e as Error).message}`);
			break;
		}
		for (const r of data.repos ?? []) dids.push(r.did);
		cursor = data.cursor;
	} while (cursor);
	return dids;
}

/** Resolve a DID's PDS service endpoint (PLC + did:web). */
async function resolvePds(did: string): Promise<string | null> {
	try {
		const doc = did.startsWith('did:web:')
			? ((await getJson(
					`https://${did.slice('did:web:'.length)}/.well-known/did.json`
				)) as JsonObject)
			: ((await getJson(`https://plc.directory/${did}`)) as JsonObject);
		const services = (doc.service as { id: string; serviceEndpoint: string }[]) ?? [];
		return services.find((s) => s.id === '#atproto_pds')?.serviceEndpoint ?? null;
	} catch {
		return null;
	}
}

async function listRecords(
	pds: string,
	did: string,
	collection: string
): Promise<{ rkey: string; value: unknown }[]> {
	const out: { rkey: string; value: unknown }[] = [];
	let cursor: string | undefined;
	do {
		const url = new URL(`${pds}/xrpc/com.atproto.repo.listRecords`);
		url.searchParams.set('repo', did);
		url.searchParams.set('collection', collection);
		url.searchParams.set('limit', '100');
		if (cursor) url.searchParams.set('cursor', cursor);
		let data: { records?: { uri: string; value: unknown }[]; cursor?: string };
		try {
			data = (await getJson(url)) as typeof data;
		} catch {
			break; // collection absent / PDS hiccup — treat as no records
		}
		for (const r of data.records ?? []) out.push({ rkey: r.uri.split('/').pop()!, value: r.value });
		cursor = data.cursor;
	} while (cursor);
	return out;
}

/** Recursively collect every blob CID referenced anywhere in a record. */
function collectBlobCids(value: unknown, acc: Set<string>): void {
	if (!value || typeof value !== 'object') return;
	const obj = value as JsonObject;
	if (obj.$type === 'blob') {
		const ref = obj.ref as { $link?: string } | string | undefined;
		const cid = typeof ref === 'string' ? ref : ref?.$link;
		if (typeof cid === 'string') acc.add(cid);
		return;
	}
	for (const v of Object.values(obj)) {
		if (Array.isArray(v)) v.forEach((x) => collectBlobCids(x, acc));
		else collectBlobCids(v, acc);
	}
}

async function downloadBlob(
	pds: string,
	did: string,
	cid: string,
	destDir: string
): Promise<boolean> {
	const url = new URL(`${pds}/xrpc/com.atproto.sync.getBlob`);
	url.searchParams.set('did', did);
	url.searchParams.set('cid', cid);
	const res = await fetch(url);
	if (!res.ok) {
		console.warn(`    ! blob ${cid}: ${res.status}`);
		return false;
	}
	await writeFile(join(destDir, cid), Buffer.from(await res.arrayBuffer()));
	return true;
}

async function backupRepo(did: string, root: string): Promise<{ records: number; blobs: number }> {
	const pds = await resolvePds(did);
	if (!pds) {
		console.warn(`  ! ${did}: no PDS endpoint, skipping`);
		return { records: 0, blobs: 0 };
	}
	const didDir = join(root, did);
	const blobCids = new Set<string>();
	let records = 0;

	for (const collection of COLLECTIONS) {
		const recs = await listRecords(pds, did, collection);
		if (recs.length === 0) continue;
		const colDir = join(didDir, collection);
		await mkdir(colDir, { recursive: true });
		for (const rec of recs) {
			await writeFile(join(colDir, `${rec.rkey}.json`), JSON.stringify(rec.value, null, 2));
			collectBlobCids(rec.value, blobCids);
			records++;
		}
	}

	let blobs = 0;
	if (blobCids.size > 0) {
		const blobDir = join(didDir, '_blobs');
		await mkdir(blobDir, { recursive: true });
		for (const cid of blobCids) if (await downloadBlob(pds, did, cid, blobDir)) blobs++;
	}
	return { records, blobs };
}

// ---- main ----
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const root = join(OUT_ROOT, stamp);
await mkdir(root, { recursive: true });
console.log(`Backup → ${root}`);
console.log(`Discovering repos via ${RELAY} ...`);

const didSet = new Set<string>();
for (const c of DISCOVERY_COLLECTIONS) {
	const dids = await listReposByCollection(c);
	dids.forEach((d) => didSet.add(d));
	console.log(`  ${c}: ${dids.length} repos`);
}
let dids = [...didSet];
if (dids.length > LIMIT) dids = dids.slice(0, LIMIT);
console.log(
	`${didSet.size} unique repos${Number.isFinite(LIMIT) ? ` (limited to ${dids.length})` : ''}\n`
);

let okRepos = 0;
let failRepos = 0;
let totalRecords = 0;
let totalBlobs = 0;
let nextIndex = 0;
let completed = 0;

// Repos run in parallel (almost all time is network wait); each repo's own collections + blobs stay
// sequential to be gentle on a single PDS. Workers pull from a shared cursor until the list is drained.
async function worker(): Promise<void> {
	for (;;) {
		const i = nextIndex++;
		if (i >= dids.length) return;
		const did = dids[i];
		try {
			const { records, blobs } = await backupRepo(did, root);
			totalRecords += records;
			totalBlobs += blobs;
			okRepos++;
			console.log(`[${++completed}/${dids.length}] ${did} — ${records} records, ${blobs} blobs`);
		} catch (e) {
			failRepos++;
			console.warn(`[${++completed}/${dids.length}] ${did} — FAILED: ${(e as Error).message}`);
		}
	}
}

console.log(`Backing up with concurrency ${CONCURRENCY} ...`);
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, dids.length) }, () => worker()));

console.log(
	`\nDone: ${okRepos} repos ok, ${failRepos} failed, ${totalRecords} records, ${totalBlobs} blobs`
);
console.log(`→ ${root}`);
