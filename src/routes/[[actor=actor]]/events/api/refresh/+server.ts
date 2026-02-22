import { createCache } from '$lib/cache';
import { error, json } from '@sveltejs/kit';
import { getActor } from '$lib/actor';
import { listRecords } from '$lib/atproto/methods.js';
import type { EventData } from '$lib/cards/social/EventCard';
import type { Did } from '@atcute/lexicons';

export async function GET({ params, platform, request }) {
	const cache = createCache(platform);
	if (!cache) return json('no cache');

	const did = await getActor({ request, paramActor: params.actor, platform, blockBoth: false });

	if (!did) {
		throw error(404, 'Not found');
	}

	// Delete stale caches
	await Promise.all([cache.delete('events', did), cache.delete('ical', `${did}:calendar`)]).catch(
		() => {}
	);

	// Re-fetch and cache
	const [records, hostProfile] = await Promise.all([
		listRecords({
			did: did as Did,
			collection: 'community.lexicon.calendar.event',
			limit: 100
		}),
		cache.getProfile(did as Did).catch(() => null)
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

	await cache.putJSON('events', did, result).catch(() => {});

	return json(result);
}
