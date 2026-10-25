import type { D1Database } from '@cloudflare/workers-types';

export const DAILY_SCREENSHOT_LIMIT = 10;
export const ACTOR_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const LEASE_MS = 60_000;

// The singleton lease serializes generation across ALL isolates, not just one process.
// Count attempts (including failures), and require the per-actor cooldown in the same statement.
export const RESERVE_SCREENSHOT_SQL = `
INSERT INTO blento_og_budget (id, day, used, lease_token, lease_until)
SELECT 'global', ?1, 1, ?2, ?3
WHERE NOT EXISTS (
  SELECT 1 FROM blento_og_actor_budget WHERE actor = ?4 AND next_allowed_at > ?5
)
ON CONFLICT(id) DO UPDATE SET
  day = excluded.day,
  used = CASE WHEN blento_og_budget.day = excluded.day THEN blento_og_budget.used + 1 ELSE 1 END,
  lease_token = excluded.lease_token,
  lease_until = excluded.lease_until
WHERE blento_og_budget.lease_until <= ?5
  AND (blento_og_budget.day <> excluded.day OR blento_og_budget.used < ?6)
RETURNING id`;

export async function reserveScreenshot(
	db: D1Database,
	actor: string,
	now = Date.now()
): Promise<string | undefined> {
	const token = crypto.randomUUID();
	const day = new Date(now).toISOString().slice(0, 10);
	const acquired = await db
		.prepare(RESERVE_SCREENSHOT_SQL)
		.bind(day, token, now + LEASE_MS, actor, now, DAILY_SCREENSHOT_LIMIT)
		.first();
	if (!acquired) return;
	try {
		await db
			.prepare(
				`INSERT INTO blento_og_actor_budget (actor, next_allowed_at) VALUES (?, ?)
         ON CONFLICT(actor) DO UPDATE SET next_allowed_at = excluded.next_allowed_at`
			)
			.bind(actor, now + ACTOR_COOLDOWN_MS)
			.run();
		return token;
	} catch (err) {
		await releaseScreenshot(db, token);
		throw err;
	}
}

export async function releaseScreenshot(db: D1Database, token: string): Promise<void> {
	await db
		.prepare('UPDATE blento_og_budget SET lease_until = 0 WHERE id = ? AND lease_token = ?')
		.bind('global', token)
		.run();
}
