/**
 * Snapshot the rendered HTML of the current live sites — the diff oracle (plan §9).
 * Saves diff-snapshots/<did>.html plus a manifest. Run AFTER the open v1 PRs merge so the new
 * card types are captured.
 *
 * NOTE: this captures *rendered output at time T*. To compare a v2 render fairly, the v2 render
 * must see the same upstream data the live snapshot baked in — that's the `freeze` step
 * (freeze.ts), which can only be built once v2 has data loaders.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { listSites, type SiteRef } from './sites.ts';

export interface SnapshotOptions {
	origin?: string;
	outDir?: string;
}

export interface SnapshotEntry {
	id: string;
	url: string;
	status: number;
	ok: boolean;
}

const sanitize = (id: string) => id.replace(/[^a-z0-9._-]/gi, '_');

export async function snapshotSites(
	sites: SiteRef[],
	opts: SnapshotOptions = {}
): Promise<SnapshotEntry[]> {
	const origin = opts.origin ?? process.env.DIFF_LIVE_ORIGIN ?? 'https://blento.app';
	const outDir = opts.outDir ?? new URL('../../diff-snapshots/', import.meta.url).pathname;
	await mkdir(outDir, { recursive: true });

	const manifest: SnapshotEntry[] = [];
	for (const site of sites) {
		const actor = site.handle ?? site.did;
		const url = `${origin}/${actor}`;
		try {
			const res = await fetch(url, { headers: { 'user-agent': 'blento-diff-harness' } });
			if (res.ok) await writeFile(`${outDir}${sanitize(site.did)}.html`, await res.text());
			manifest.push({ id: site.did, url, status: res.status, ok: res.ok });
			console.error(`${res.ok ? 'saved' : 'skip '} ${actor} (${res.status})`);
		} catch (e) {
			manifest.push({ id: site.did, url, status: 0, ok: false });
			console.error(`error ${actor}: ${(e as Error).message}`);
		}
	}

	await writeFile(
		`${outDir}manifest.json`,
		JSON.stringify({ origin, saved: manifest.filter((m) => m.ok).length, sites: manifest }, null, 2)
	);
	return manifest;
}

// CLI: `tsx snapshot.ts` → enumerate then snapshot (MAX_SITES env caps the count).
if (import.meta.url === `file://${process.argv[1]}`) {
	const max = process.env.MAX_SITES ? Number(process.env.MAX_SITES) : undefined;
	const sites = await listSites({ maxSites: max });
	console.error(`snapshotting ${sites.length} sites…`);
	const manifest = await snapshotSites(sites);
	console.error(`done: ${manifest.filter((m) => m.ok).length}/${manifest.length} saved`);
}
