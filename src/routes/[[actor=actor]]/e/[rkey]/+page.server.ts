import { error } from '@sveltejs/kit';
import type { EventData } from '$lib/cards/social/EventCard';
import { getBlentoOrBskyProfile, resolveHandle } from '$lib/atproto/methods.js';
import { isHandle } from '@atcute/lexicons/syntax';
import { createCache, type CachedProfile } from '$lib/cache';
import type { Did } from '@atcute/lexicons';

export async function load({ params, platform }) {
	const { rkey } = params;
	const did = isHandle(params.actor) ? await resolveHandle({ handle: params.actor }) : params.actor;

	if (!did || !rkey) {
		throw error(404, 'Event not found');
	}

	try {
		const cache = createCache(platform);

		console.log(
			`https://smokesignal.events/xrpc/community.lexicon.calendar.GetEvent?repository=${encodeURIComponent(did)}&record_key=${encodeURIComponent(rkey)}`
		);

		const [eventResponse, hostProfile] = await Promise.all([
			fetch(
				`https://smokesignal.events/xrpc/community.lexicon.calendar.GetEvent?repository=${encodeURIComponent(did)}&record_key=${encodeURIComponent(rkey)}`
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

		if (!eventResponse.ok) {
			throw error(404, 'Event not found');
		}

		const eventData: EventData = await eventResponse.json();

		return {
			eventData,
			did,
			rkey,
			hostProfile: hostProfile ?? null
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Event not found');
	}
}
