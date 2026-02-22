import { createCache } from '$lib/cache';
import { error, json } from '@sveltejs/kit';
import { getActor } from '$lib/actor';
import { fetchUserRsvps, resolveProfile } from '$lib/events/fetch-attendees';

export async function GET({ params, platform, request }) {
	const cache = createCache(platform);
	if (!cache) return json('no cache');

	const did = await getActor({ request, paramActor: params.actor, platform, blockBoth: false });

	if (!did) {
		throw error(404, 'Not found');
	}

	// Delete stale caches
	await Promise.all([
		cache.delete('rsvps', did),
		cache.delete('ical', `${did}:rsvp-calendar`)
	]).catch(() => {});

	// Re-fetch and cache
	const [rsvps, userProfile] = await Promise.all([
		fetchUserRsvps(did, cache),
		resolveProfile(did, cache)
	]);

	const result = {
		rsvps,
		did,
		userProfile: userProfile ?? null
	};

	await cache.putJSON('rsvps', did, result).catch(() => {});

	return json(result);
}
