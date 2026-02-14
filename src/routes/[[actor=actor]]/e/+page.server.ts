import { error } from '@sveltejs/kit';
import type { EventData } from '$lib/cards/social/EventCard';
import { getBlentoOrBskyProfile } from '$lib/atproto/methods.js';
import { createCache, type CachedProfile } from '$lib/cache';
import type { Did } from '@atcute/lexicons';
import { getActor } from '$lib/actor.js';

export async function load({ params, platform, request }) {
	const cache = createCache(platform);

	const did = await getActor({ request, paramActor: params.actor, platform });

	if (!did) {
		throw error(404, 'Events not found');
	}

	try {
		const [eventsResponse, hostProfile] = await Promise.all([
			fetch(
				`https://smokesignal.events/xrpc/community.lexicon.calendar.searchEvents?repository=${encodeURIComponent(did)}&query=upcoming`
			),
			cache
				? cache.getProfile(did as Did).catch(() => null)
				: getBlentoOrBskyProfile({ did: did as Did })
						.then(
							(p): CachedProfile => ({
								did: p.did as string,
								handle: p.handle as string,
								displayName: p.displayName as string | undefined,
								avatar: p.avatar as string | undefined,
								hasBlento: p.hasBlento,
								url: p.url
							})
						)
						.catch(() => null)
		]);

		if (!eventsResponse.ok) {
			throw error(404, 'Events not found');
		}

		const data: { results: EventData[] } = await eventsResponse.json();
		const events = data.results;

		return {
			events,
			did,
			hostProfile: hostProfile ?? null
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Events not found');
	}
}
