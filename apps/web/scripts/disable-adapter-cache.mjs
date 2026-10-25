import { readFile, writeFile } from 'node:fs/promises';

/**
 * adapter-cloudflare performs URL-only reads BEFORE hooks, and writes AFTER hooks.
 * Cookies and X-Custom-Domain therefore cannot safely share its automatic cache.
 * Keep asset-first routing, but let Blento's guarded hook own rendered-page caching.
 * Fail the build on upstream code-shape changes rather than silently reintroducing this layer.
 * @param {string} path
 */
export async function disableAdapterCache(path) {
	let source = await readFile(path, 'utf8');
	const replacements = [
		['let res = !pragma.includes("no-cache") && await r2(req);', 'let res;'],
		['return pragma && res.status < 400 ? c(req, res, ctx) : res;', 'return res;']
	];
	for (const [before, after] of replacements) {
		if (source.split(before).length !== 2) {
			throw new Error(
				'Cloudflare adapter cache implementation changed: review cookie/domain safety before building'
			);
		}
		source = source.replace(before, after);
	}
	await writeFile(path, source);
}
