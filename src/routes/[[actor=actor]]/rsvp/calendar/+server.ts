import { error } from '@sveltejs/kit';
import { getCDNImageBlobUrl } from '$lib/atproto/methods.js';
import { createCache } from '$lib/cache';
import { getActor } from '$lib/actor';
import { generateICalFeed, type ICalAttendee, type ICalEvent } from '$lib/ical';
import {
	fetchEventRsvps,
	fetchUserRsvps,
	getProfileUrl,
	resolveProfile
} from '$lib/events/fetch-attendees';

export async function GET({ params, platform, request }) {
	const cache = createCache(platform);

	const did = await getActor({ request, paramActor: params.actor, platform });

	if (!did) {
		throw error(404, 'Not found');
	}

	try {
		// Check cache first
		const cacheKey = `${did}:rsvp-calendar`;
		if (cache) {
			const cached = await cache.get('ical', cacheKey);
			if (cached) {
				return new Response(cached, {
					headers: {
						'Content-Type': 'text/calendar; charset=utf-8',
						'Cache-Control': 'public, max-age=3600'
					}
				});
			}
		}

		const [rsvps, userProfile] = await Promise.all([
			fetchUserRsvps(did, cache),
			resolveProfile(did, cache)
		]);

		// Enrich each RSVP with attendees and image URLs for the iCal feed
		const events: ICalEvent[] = (
			await Promise.all(
				rsvps.map(async (rsvp) => {
					try {
						const actor = rsvp.hostProfile?.handle || rsvp.hostDid;
						const thumbnail = rsvp.event.media?.find((m) => m.role === 'thumbnail');
						const imageUrl = thumbnail?.content
							? getCDNImageBlobUrl({
									did: rsvp.hostDid,
									blob: thumbnail.content,
									type: 'jpeg'
								})
							: undefined;

						const rsvpMap = await fetchEventRsvps(rsvp.eventUri).catch(
							() => new Map<string, 'going' | 'interested'>()
						);
						const attendees: ICalAttendee[] = [];
						await Promise.all(
							Array.from(rsvpMap.entries()).map(async ([attendeeDid, status]) => {
								const profile = await resolveProfile(attendeeDid, cache).catch(() => null);
								attendees.push({
									name: profile?.handle || attendeeDid,
									status,
									url: getProfileUrl(attendeeDid, profile)
								});
							})
						);

						return {
							eventData: rsvp.event,
							uid: rsvp.eventUri,
							url: `https://blento.app/${actor}/events/${rsvp.rkey}`,
							organizer: actor,
							imageUrl,
							attendees
						} satisfies ICalEvent;
					} catch {
						return null;
					}
				})
			)
		).filter((e) => e !== null);

		const actor = userProfile?.handle || did;
		const calendarName = `${userProfile?.displayName || actor}'s RSVP Events`;
		const ical = generateICalFeed(events, calendarName);

		// Store in cache
		if (cache) {
			await cache.put('ical', cacheKey, ical).catch(() => {});
		}

		return new Response(ical, {
			headers: {
				'Content-Type': 'text/calendar; charset=utf-8',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(500, 'Failed to generate calendar');
	}
}
