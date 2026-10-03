import { getRecord } from '$lib/atproto/methods.js';
import type { Did } from '@atcute/lexicons';
import { getActor } from '$lib/helpers/actor.js';

export async function load({ params, platform, request }) {
	const did = await getActor({ request, paramActor: params.actor, platform });

	if (!did) return { accentColor: undefined, baseColor: undefined };

	try {
		const publication = await getRecord({
			did: did as Did,
			collection: 'app.blento.page',
			rkey: 'blento.self'
		}).catch(() =>
			// Home pages that have not been re-saved still use the legacy collection.
			getRecord({
				did: did as Did,
				collection: 'site.standard.publication',
				rkey: 'blento.self'
			})
		);

		const preferences = publication?.value?.preferences as
			| { accentColor?: string; baseColor?: string }
			| undefined;

		return {
			accentColor: preferences?.accentColor,
			baseColor: preferences?.baseColor
		};
	} catch {
		return { accentColor: undefined, baseColor: undefined };
	}
}
