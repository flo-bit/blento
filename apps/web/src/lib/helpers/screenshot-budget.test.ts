import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import type { D1Database } from '@cloudflare/workers-types';
import {
	ACTOR_COOLDOWN_MS,
	DAILY_SCREENSHOT_LIMIT,
	releaseScreenshot,
	reserveScreenshot
} from './screenshot-budget';

let sqlite: DatabaseSync;
let db: D1Database;
beforeEach(() => {
	sqlite = new DatabaseSync(':memory:');
	sqlite.exec(
		readFileSync(new URL('../../../scripts/cost-guardrails.sql', import.meta.url), 'utf8')
	);
	db = {
		prepare: (sql: string) => ({
			bind: (...args: (string | number)[]) => {
				const params: (string | number)[] = [];
				const expanded = sql.replace(/\?(\d+)/g, (_match, n: string) => {
					params.push(args[Number(n) - 1]);
					return '?';
				});
				const statement = sqlite.prepare(expanded);
				const values = params.length ? params : args;
				return {
					first: async () => statement.get(...values) ?? null,
					run: async () => statement.run(...values)
				};
			}
		})
	} as unknown as D1Database;
});
afterEach(() => sqlite.close());

const now = Date.UTC(2026, 9, 12, 12);
describe('global screenshot SQL budget', () => {
	it('allows only one concurrently leased job, across actors', async () => {
		const leases = await Promise.all(
			Array.from({ length: 20 }, (_, i) => reserveScreenshot(db, `actor${i}`, now))
		);
		expect(leases.filter(Boolean)).toHaveLength(1);
	});
	it('caps attempts, even when jobs fail', async () => {
		for (let i = 0; i < DAILY_SCREENSHOT_LIMIT; i++) {
			const lease = await reserveScreenshot(db, `actor${i}`, now);
			expect(lease).toBeTruthy();
			await releaseScreenshot(db, lease!);
		}
		expect(await reserveScreenshot(db, 'extra', now)).toBeUndefined();
	});
	it('enforces actor cooldown and permits a later update', async () => {
		const first = await reserveScreenshot(db, 'owner', now);
		await releaseScreenshot(db, first!);
		expect(await reserveScreenshot(db, 'owner', now + 1000)).toBeUndefined();
		expect(await reserveScreenshot(db, 'owner', now + ACTOR_COOLDOWN_MS)).toBeTruthy();
	});
	it('resets the budget on UTC day boundaries without bypassing an active lease', async () => {
		const midnight = Date.UTC(2026, 9, 13);
		const lease = await reserveScreenshot(db, 'one', midnight - 1000);
		expect(await reserveScreenshot(db, 'two', midnight)).toBeUndefined();
		await releaseScreenshot(db, lease!);
		expect(await reserveScreenshot(db, 'two', midnight)).toBeTruthy();
		const row = sqlite.prepare('SELECT day, used FROM blento_og_budget').get();
		expect(row).toMatchObject({ day: '2026-10-13', used: 1 });
	});
	it('recovers an expired lease, and an old token cannot unlock a new job', async () => {
		const old = await reserveScreenshot(db, 'one', now);
		const next = await reserveScreenshot(db, 'two', now + 61_000);
		expect(next).toBeTruthy();
		await releaseScreenshot(db, old!);
		expect(await reserveScreenshot(db, 'three', now + 62_000)).toBeUndefined();
	});
});
