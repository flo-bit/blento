import { error } from '@sveltejs/kit';
import type { EventData } from '$lib/cards/social/EventCard';
import { getBlentoOrBskyProfile, getRecord } from '$lib/atproto/methods.js';
import { createCache, type CachedProfile } from '$lib/cache';
import type { Did } from '@atcute/lexicons';
import { getActor } from '$lib/actor';

export async function load({ params, platform, request }) {
	const { rkey } = params;

	const cache = createCache(platform);

	const did = await getActor({ request, paramActor: params.actor, platform });

	if (!did || !rkey) {
		throw error(404, 'Event not found');
	}

	try {
		const [eventRecord, hostProfile] = await Promise.all([
			getRecord({
				did: did as Did,
				collection: 'community.lexicon.calendar.event',
				rkey
			}),
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

		if (!eventRecord?.value) {
			throw error(404, 'Event not found');
		}

		const eventData: EventData = eventRecord.value as EventData;
		console.log(eventData);

		return {
			eventData,
			did,
			rkey,
			hostProfile: hostProfile ?? null,
			eventCid: (eventRecord.cid as string) ?? null
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Event not found');
	}
}
