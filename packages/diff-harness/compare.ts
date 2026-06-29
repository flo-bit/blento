/**
 * CLI: structurally diff two HTML files (live snapshot vs new render).
 *   node --experimental-strip-types compare.ts <live.html> <new.html>
 * Exit code 0 = structurally identical; 1 = divergences (printed).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeHtml } from './normalize.ts';
import { diffStruct } from './diff.ts';

// Resolve args against where the command was invoked (pnpm runs scripts in the package dir).
const base = process.env.INIT_CWD ?? process.cwd();
const [liveArg, newArg] = process.argv.slice(2);
if (!liveArg || !newArg) {
	console.error('usage: compare <live.html> <new.html>');
	process.exit(2);
}
const liveFile = resolve(base, liveArg);
const newFile = resolve(base, newArg);

const divergences = diffStruct(
	normalizeHtml(readFileSync(liveFile, 'utf8')),
	normalizeHtml(readFileSync(newFile, 'utf8'))
);

if (divergences.length === 0) {
	console.log('✓ structurally identical');
	process.exit(0);
}

console.log(`✗ ${divergences.length} divergence(s):\n`);
for (const d of divergences.slice(0, 200)) {
	console.log(`  [${d.kind}] ${d.path}\n        ${d.detail}`);
}
if (divergences.length > 200) console.log(`  … and ${divergences.length - 200} more`);
process.exit(1);
