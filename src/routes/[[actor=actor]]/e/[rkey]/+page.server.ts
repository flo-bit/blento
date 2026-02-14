import { error } from '@sveltejs/kit';
import type { EventData } from '$lib/cards/social/EventCard';
import { getBlentoOrBskyProfile, getRecord, resolveHandle } from '$lib/atproto/methods.js';
import { isHandle } from '@atcute/lexicons/syntax';
import { createCache, type CachedProfile } from '$lib/cache';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { env as publicEnv } from '$env/dynamic/public';

export async function load({ params, platform, request }) {
	const { rkey } = params;

	const cache = createCache(platform);

	const customDomain = request.headers.get('X-Custom-Domain')?.toLowerCase();

	let actor: ActorIdentifier | undefined = params.actor;

	if (!actor) {
		const kv = platform?.env?.CUSTOM_DOMAINS;

		if (kv && customDomain) {
			try {
				const did = await kv.get(customDomain);

				if (did) actor = did as ActorIdentifier;
			} catch (error) {
				console.error('failed to get custom domain kv', error);
			}
		} else {
			actor = publicEnv.PUBLIC_HANDLE as ActorIdentifier;
		}
	} else if (customDomain && params.actor) {
		actor = undefined;
	}

	const did = isHandle(actor) ? await resolveHandle({ handle: actor }) : actor;

	if (!did || !rkey) {
		throw error(404, 'Event not found');
	}

	try {
		const [eventResponse, hostProfile, eventRecord] = await Promise.all([
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
						.catch(() => null),
			getRecord({
				did: did as Did,
				collection: 'community.lexicon.calendar.event',
				rkey
			}).catch(() => null)
		]);

		if (!eventResponse.ok) {
			throw error(404, 'Event not found');
		}

		const eventData: EventData = await eventResponse.json();

		return {
			eventData,
			did,
			rkey,
			hostProfile: hostProfile ?? null,
			eventCid: (eventRecord?.cid as string) ?? null
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Event not found');
	}
}
