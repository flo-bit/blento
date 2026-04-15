/**
 * Discover users from relays and backfill their records from PDS.
 *
 * Usage:
 *   pnpm sync           # local D1
 *   pnpm sync:remote    # prod D1
 */
import { Contrail } from '@atmo-dev/contrail';
import { config } from '../src/lib/contrail/config';
import { getPlatformProxy } from 'wrangler';

function elapsed(start: number): string {
	const ms = Date.now() - start;
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
	const mins = Math.floor(ms / 60_000);
	const secs = ((ms % 60_000) / 1000).toFixed(0);
	return `${mins}m ${secs}s`;
}

async function main() {
	const remote = process.argv.includes('--remote');
	const syncStart = Date.now();

	console.log(`=== Sync (${remote ? 'remote/prod' : 'local'} D1) ===\n`);

	const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({
		environment: remote ? 'production' : undefined
	});

	const contrail = new Contrail({ ...config, db: env.DB });

	try {
		await contrail.init();

		console.log('--- Discovery ---');
		const discoveryStart = Date.now();
		const discovered = await contrail.discover();
		console.log(`  Done: ${discovered.length} users in ${elapsed(discoveryStart)}\n`);

		console.log('--- Backfill ---');
		const backfillStart = Date.now();
		const total = await contrail.backfill({
			concurrency: 100,
			onProgress: ({ records, usersComplete, usersTotal, usersFailed }) => {
				const secs = (Date.now() - backfillStart) / 1000;
				const rate = secs > 0 ? Math.round(records / secs) : 0;
				const failStr = usersFailed > 0 ? ` | ${usersFailed} failed` : '';
				process.stdout.write(
					`\r  ${records} records | ${usersComplete}/${usersTotal} users | ${rate}/s | ${elapsed(backfillStart)}${failStr}   `
				);
			}
		});
		process.stdout.write('\n');
		console.log(`  Done: ${total} records in ${elapsed(backfillStart)}\n`);

		console.log(`=== Finished in ${elapsed(syncStart)} ===`);
		console.log(`  Discovered: ${discovered.length} users`);
		console.log(`  Backfilled: ${total} records`);
	} finally {
		await dispose();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
