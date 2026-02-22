import { error } from '@sveltejs/kit';
import { createCache } from '$lib/cache';
import type { CachedProfile } from '$lib/cache';
import { getActor } from '$lib/actor.js';
import { fetchUserRsvps, resolveProfile, type ResolvedRsvp } from '$lib/events/fetch-attendees';

export async function load({ params, platform, request }) {
	const cache = createCache(platform);

	const did = await getActor({ request, paramActor: params.actor, platform });

	if (!did) {
		throw error(404, 'RSVPs not found');
	}

	try {
		// Try cache first
		if (cache) {
			const cached = await cache.getJSON<{
				rsvps: ResolvedRsvp[];
				did: string;
				userProfile: CachedProfile | null;
			}>('rsvps', did);
			if (cached) return cached;
		}

		const [rsvps, userProfile] = await Promise.all([
			fetchUserRsvps(did, cache),
			resolveProfile(did, cache)
		]);

		const result = {
			rsvps,
			did,
			userProfile: userProfile ?? null
		};

		// Cache the result
		if (cache) {
			await cache.putJSON('rsvps', did, result).catch(() => {});
		}

		return result;
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'RSVPs not found');
	}
}
