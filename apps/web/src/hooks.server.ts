import type { Handle } from '@sveltejs/kit';
import { restoreSession } from '$lib/atproto/server/session';
import { isDidBlocked } from '$lib/helpers/moderation';
import { isProbePath } from '$lib/helpers/probe-paths';
import { resolvePublicPage } from '$lib/helpers/public-page-cache';

export const handle: Handle = async ({ event, resolve }) => {
	// Cheap fallback for alternate hosts/proxies that do not pass through the zone WAF.
	if (isProbePath(event.url.pathname)) {
		return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
	}
	if (event.url.pathname === '/healthz' && ['GET', 'HEAD'].includes(event.request.method)) {
		return resolve(event);
	}
	const customDomain = event.request.headers.get('X-Custom-Domain')?.toLowerCase() || undefined;

	const { session, client, did } = await restoreSession(
		event.cookies,
		event.platform?.env,
		customDomain
	);

	event.locals.session = session;
	event.locals.client = client;
	event.locals.did = did;

	if (isDidBlocked(did)) {
		return new Response('Forbidden', {
			status: 403,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	return resolvePublicPage(event, async () => resolve(event));
};
