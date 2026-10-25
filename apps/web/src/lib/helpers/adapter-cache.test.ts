import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { disableAdapterCache } from '../../../scripts/disable-adapter-cache.mjs';

let directory: string;
let path: string;
beforeEach(async () => {
	directory = await mkdtemp(join(tmpdir(), 'blento-adapter-test-'));
	path = join(directory, '_worker.js');
});
afterEach(async () => rm(directory, { recursive: true, force: true }));

describe('adapter URL-only caching guard', () => {
	it('removes reads before hooks and writes after hooks', async () => {
		await writeFile(
			path,
			'let res = !pragma.includes("no-cache") && await r2(req);\nreturn pragma && res.status < 400 ? c(req, res, ctx) : res;'
		);
		await disableAdapterCache(path);
		const source = await readFile(path, 'utf8');
		expect(source).not.toContain('r2(req)');
		expect(source).not.toContain('c(req, res, ctx)');
	});
	it('fails a build if an adapter upgrade changes the cache implementation', async () => {
		await writeFile(path, 'unknown upstream implementation');
		await expect(disableAdapterCache(path)).rejects.toThrow('implementation changed');
		expect(await readFile(path, 'utf8')).toBe('unknown upstream implementation');
	});
});
