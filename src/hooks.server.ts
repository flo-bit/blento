import type { Handle } from '@sveltejs/kit';
import { restoreSession } from '$lib/atproto/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	const customDomain = event.request.headers.get('X-Custom-Domain')?.toLowerCase() || undefined;

	const { session, client, did } = await restoreSession(
		event.cookies,
		event.platform?.env,
		customDomain
	);

	event.locals.session = session;
	event.locals.client = client;
	event.locals.did = did;

	return resolve(event);
};
