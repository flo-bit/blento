import type { D1Database } from '@cloudflare/workers-types';
import { Contrail } from '@atmo-dev/contrail';
import { createHandler } from '@atmo-dev/contrail/server';
import { Client } from '@atcute/client';
import { config } from './config';

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
 * No HTTP roundtrip — calls createHandler directly.
 */
export function getServerClient(db: D1Database) {
	return new Client({
		handler: async (pathname, init) => {
			await ensureInit(db);
			const url = new URL(pathname, 'http://localhost');
			return handle(new Request(url, init), db) as Promise<Response>;
		}
	});
}
