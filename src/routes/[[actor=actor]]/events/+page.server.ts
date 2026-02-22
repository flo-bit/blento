import { error } from '@sveltejs/kit';
import type { EventData } from '$lib/cards/social/EventCard';
import { getBlentoOrBskyProfile, listRecords } from '$lib/atproto/methods.js';
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
		// Try cache first
		if (cache) {
			const cached = await cache.getJSON<{
				events: (EventData & { rkey: string })[];
				did: string;
				hostProfile: CachedProfile | null;
			}>('events', did);
			if (cached) return cached;
		}

		const [records, hostProfile] = await Promise.all([
			listRecords({
				did: did as Did,
				collection: 'community.lexicon.calendar.event',
				limit: 100
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

		const events = records.map((r) => ({
			...(r.value as EventData),
			rkey: r.uri.split('/').pop() as string
		}));

		const result = {
			events,
			did,
			hostProfile: hostProfile ?? null
		};

		// Cache the result
		if (cache) {
			await cache.putJSON('events', did, result).catch(() => {});
		}

		return result;
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Events not found');
	}
}
