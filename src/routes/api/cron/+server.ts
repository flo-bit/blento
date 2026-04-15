import { contrail, ensureInit } from '$lib/contrail';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const secret = request.headers.get('X-Cron-Secret');
	if (secret !== platform!.env.CRON_SECRET) {
		return new Response('Unauthorized', { status: 401 });
	}

	const db = platform!.env.DB;
	await ensureInit(db);
	await contrail.ingest({}, db);

	return new Response('OK');
};
