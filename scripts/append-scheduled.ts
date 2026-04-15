/**
 * Post-build script: appends a `scheduled` handler to the SvelteKit worker output.
 *
 * SvelteKit's adapter-cloudflare doesn't support the `scheduled` export natively
 * (see https://github.com/sveltejs/kit/issues/4841). This script patches the
 * generated _worker.js to add one that self-calls the /api/cron endpoint.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workerPath = join(root, '.svelte-kit', 'cloudflare', '_worker.js');

let code = readFileSync(workerPath, 'utf-8');

code += `
// --- Appended by scripts/append-scheduled.ts ---
worker_default.scheduled = async function (event, env, ctx) {
	const req = new Request('http://localhost/api/cron', {
		method: 'POST',
		headers: { 'X-Cron-Secret': env.CRON_SECRET || '' }
	});
	ctx.waitUntil(this.fetch(req, env, ctx));
};
`;

writeFileSync(workerPath, code);
console.log('Appended scheduled handler to _worker.js');
