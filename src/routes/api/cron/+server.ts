import { timingSafeEqual } from 'node:crypto';
import { contrail, ensureInit } from '$lib/contrail';
import type { RequestHandler } from './$types';

function safeEqual(a: string, b: string): boolean {
	const aBuf = new TextEncoder().encode(a);
	const bBuf = new TextEncoder().encode(b);
	if (aBuf.length !== bBuf.length) return false;
	return timingSafeEqual(aBuf, bBuf);
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const secret = request.headers.get('X-Cron-Secret') ?? '';
	const expected = platform!.env.CRON_SECRET ?? '';
	if (!expected || !safeEqual(secret, expected)) {
		return new Response('Unauthorized', { status: 401 });
	}

	const db = platform!.env.DB;
	await ensureInit(db);
	await contrail.ingest({}, db);

	return new Response('OK');
};
