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

	const response = await resolve(event);

	// Signal that this content may not be used for AI training.
	// `Content-Usage: ai=n` is the emerging IETF AIPREF standard; `X-Robots-Tag:
	// noai` is the de-facto convention. Both are declarative — see also robots.txt,
	// the noai meta tag, and /.well-known/tdmrep.json.
	response.headers.set('Content-Usage', 'ai=n');
	response.headers.append('X-Robots-Tag', 'noai, noimageai');

	return response;
};
