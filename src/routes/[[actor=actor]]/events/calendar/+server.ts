import { error } from '@sveltejs/kit';
import type { EventData } from '$lib/cards/social/EventCard';
import { getCDNImageBlobUrl, listRecords } from '$lib/atproto/methods.js';
import { createCache } from '$lib/cache';
import type { Did } from '@atcute/lexicons';
import { getActor } from '$lib/actor';
import { generateICalFeed, type ICalAttendee, type ICalEvent } from '$lib/ical';
import { fetchEventRsvps, getProfileUrl, resolveProfile } from '$lib/events/fetch-attendees';

export async function GET({ params, platform, request }) {
	const cache = createCache(platform);

	const did = await getActor({ request, paramActor: params.actor, platform });

	if (!did) {
		throw error(404, 'Not found');
	}

	try {
		// Check cache first
		const cacheKey = `${did}:calendar`;
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

		const [records, hostProfile] = await Promise.all([
			listRecords({
				did: did as Did,
				collection: 'community.lexicon.calendar.event',
				limit: 100
			}),
			resolveProfile(did, cache)
		]);

		const actor = hostProfile?.handle || did;

		// Fetch attendees for all events in parallel
		const events: ICalEvent[] = await Promise.all(
			records.map(async (r) => {
				const eventData = r.value as EventData;
				const thumbnail = eventData.media?.find((m) => m.role === 'thumbnail');
				const imageUrl = thumbnail?.content
					? getCDNImageBlobUrl({ did, blob: thumbnail.content, type: 'jpeg' })
					: undefined;

				// Fetch RSVPs and resolve handles
				const rsvpMap = await fetchEventRsvps(r.uri).catch(() => new Map());
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
					eventData,
					uid: r.uri,
					url: `https://blento.app/${actor}/events/${r.uri.split('/').pop()}`,
					organizer: actor,
					imageUrl,
					attendees
				};
			})
		);

		const calendarName = `${hostProfile?.displayName || actor}'s Events`;
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
