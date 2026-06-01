import { error, text } from '@sveltejs/kit';
import { getActor } from '$lib/helpers/actor.js';

// Serves https://<domain>/.well-known/atproto-did for ATProto handle verification.
// Only meaningful at a domain root (the domain itself is the handle being verified),
// so we don't serve it under a /[actor] path.
export async function GET({ params, platform, request }) {
	if (params.actor) {
		throw error(404, 'Not found');
	}

	const actor = await getActor({ request, paramActor: undefined, platform });

	if (!actor) {
		throw error(404, 'Not found');
	}

	return text(actor);
}
