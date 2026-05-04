import type { D1Database } from '@cloudflare/workers-types';
import { Contrail } from '@atmo-dev/contrail';
import { createHandler, createServerClient } from '@atmo-dev/contrail/server';
import { config } from '../contrail.config';

export const contrail = new Contrail(config);

let initialized = false;

export async function ensureInit(db: D1Database) {
	if (!initialized) {
		await contrail.init(db);
		initialized = true;
	}
}

const handle = createHandler(contrail);

/**
 * Server-side: fully typed @atcute/client that routes through contrail in-process.
 * No HTTP roundtrip — calls the handler directly with the per-request DB.
 */
export function getServerClient(db: D1Database) {
	return createServerClient(async (req) => {
		await ensureInit(db);
		return handle(req, db);
	});
}
