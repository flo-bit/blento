import { createHandler } from '@atmo-dev/contrail/server';
import { contrail, ensureInit } from '$lib/contrail';
import type { RequestHandler } from './$types';

const handle = createHandler(contrail);

async function handler(request: Request, platform: App.Platform | undefined) {
	const db = platform!.env.DB;
	await ensureInit(db);
	return handle(request, db) as Promise<Response>;
}

export const GET: RequestHandler = async ({ request, platform }) => handler(request, platform);
export const POST: RequestHandler = async ({ request, platform }) => handler(request, platform);
