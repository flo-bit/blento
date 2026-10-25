import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** @returns {Promise<string>} */
export async function cloudflareToken() {
	if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
	// Local Wrangler OAuth credentials only; never print credentials or save them in reports.
	const path =
		process.env.WRANGLER_AUTH_FILE ||
		join(homedir(), 'Library/Preferences/.wrangler/config/default.toml');
	const config = await readFile(path, 'utf8');
	const token = config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
	if (!token) throw new Error('Set CLOUDFLARE_API_TOKEN or sign into Wrangler locally');
	return token;
}

export async function workerTarget() {
	const config = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
	const account =
		process.env.CLOUDFLARE_ACCOUNT_ID || config.match(/"account_id"\s*:\s*"([^"]+)"/)?.[1];
	const worker = process.env.CLOUDFLARE_WORKER_NAME || config.match(/"name"\s*:\s*"([^"]+)"/)?.[1];
	if (!account || !worker) throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_WORKER_NAME');
	return { account, worker };
}
