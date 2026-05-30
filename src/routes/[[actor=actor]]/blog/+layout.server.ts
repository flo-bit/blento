import { getPagePublication } from '$lib/atproto/methods.js';
import type { Did } from '@atcute/lexicons';
import { getActor } from '$lib/helpers/actor.js';

export async function load({ params, platform, request }) {
	const did = await getActor({ request, paramActor: params.actor, platform });

	if (!did) return { accentColor: undefined, baseColor: undefined };

	try {
		const publication = await getPagePublication({ did: did as Did });

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
