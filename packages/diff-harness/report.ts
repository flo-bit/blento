/**
 * Batch structural compare — live snapshots vs new (v2) renders. The pass/fail gate for the
 * rewrite's view side (plan §9). Operates on two directories of `<id>.html` files; produces a
 * per-site divergence summary, worst-offenders first.
 */
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizeHtml } from './normalize.ts';
import { diffStruct, type Divergence } from './diff.ts';

export interface SiteReport {
	id: string;
	divergences: number;
	sample: Divergence[];
}

export interface BatchReport {
	total: number;
	identical: number;
	changed: number;
	missingFromNew: string[];
	sites: SiteReport[];
}

export async function batchCompare(liveDir: string, newDir: string): Promise<BatchReport> {
	const liveFiles = (await readdir(liveDir)).filter((f) => f.endsWith('.html'));
	const sites: SiteReport[] = [];
	const missingFromNew: string[] = [];

	for (const file of liveFiles) {
		const id = file.replace(/\.html$/, '');
		let newHtml: string;
		try {
			newHtml = await readFile(`${newDir}/${file}`, 'utf8');
		} catch {
			missingFromNew.push(id);
			continue;
		}
		const liveHtml = await readFile(`${liveDir}/${file}`, 'utf8');
		const d = diffStruct(normalizeHtml(liveHtml), normalizeHtml(newHtml));
		sites.push({ id, divergences: d.length, sample: d.slice(0, 5) });
	}

	sites.sort((a, b) => b.divergences - a.divergences);
	return {
		total: sites.length,
		identical: sites.filter((s) => s.divergences === 0).length,
		changed: sites.filter((s) => s.divergences > 0).length,
		missingFromNew,
		sites
	};
}

// CLI: `tsx report.ts <liveDir> <newDir>` → summary + exit 1 if any site diverges or is missing.
if (import.meta.url === `file://${process.argv[1]}`) {
	const base = process.env.INIT_CWD ?? process.cwd();
	const [liveArg, newArg] = process.argv.slice(2);
	if (!liveArg || !newArg) {
		console.error('usage: report <liveDir> <newDir>');
		process.exit(2);
	}
	const r = await batchCompare(resolve(base, liveArg), resolve(base, newArg));
	console.log(
		`sites: ${r.total} | identical: ${r.identical} | changed: ${r.changed} | missing-from-new: ${r.missingFromNew.length}`
	);
	for (const s of r.sites.filter((x) => x.divergences > 0).slice(0, 25)) {
		console.log(`\n  ${s.id}: ${s.divergences} divergence(s)`);
		for (const d of s.sample) console.log(`    [${d.kind}] ${d.path} — ${d.detail}`);
	}
	process.exit(r.changed === 0 && r.missingFromNew.length === 0 ? 0 : 1);
}
