import { error } from '@sveltejs/kit';
import type { EventData } from '$lib/cards/social/EventCard';
import { getCDNImageBlobUrl, getRecord, listRecords, parseUri } from '$lib/atproto/methods.js';
import { createCache } from '$lib/cache';
import type { Did } from '@atcute/lexicons';
import { getActor } from '$lib/actor';
import { generateICalFeed, type ICalAttendee, type ICalEvent } from '$lib/ical';
import { fetchEventRsvps, getProfileUrl, resolveProfile } from '$lib/events/fetch-attendees';

interface RsvpRecord {
	$type: string;
	status: string;
	subject: { uri: string; cid?: string };
	createdAt: string;
}

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

		const [rsvpRecords, hostProfile] = await Promise.all([
			listRecords({
				did: did as Did,
				collection: 'community.lexicon.calendar.rsvp',
				limit: 100
			}),
			resolveProfile(did, cache)
		]);

		// Filter to only going and interested RSVPs
		const activeRsvps = rsvpRecords.filter((r) => {
			const rsvp = r.value as unknown as RsvpRecord;
			return rsvp.status?.endsWith('#going') || rsvp.status?.endsWith('#interested');
		});

		// Fetch each referenced event in parallel
		const eventResults = await Promise.all(
			activeRsvps.map(async (r) => {
				const rsvp = r.value as unknown as RsvpRecord;
				const parsed = parseUri(rsvp.subject.uri);
				if (!parsed?.rkey || !parsed?.repo) return null;

				try {
					const [record, organizerProfile] = await Promise.all([
						getRecord({
							did: parsed.repo as Did,
							collection: 'community.lexicon.calendar.event',
							rkey: parsed.rkey
						}),
						resolveProfile(parsed.repo, cache).catch(() => null)
					]);
					if (!record?.value) return null;
					const eventData = record.value as EventData;
					const actor = organizerProfile?.handle || parsed.repo;
					const thumbnail = eventData.media?.find((m) => m.role === 'thumbnail');
					const imageUrl = thumbnail?.content
						? getCDNImageBlobUrl({
								did: parsed.repo,
								blob: thumbnail.content,
								type: 'jpeg'
							})
						: undefined;

					// Fetch RSVPs and resolve handles
					const rsvpMap = await fetchEventRsvps(rsvp.subject.uri).catch(
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
						eventData,
						uid: rsvp.subject.uri,
						url: `https://blento.app/${actor}/events/${parsed.rkey}`,
						organizer: actor,
						imageUrl,
						attendees
					} satisfies ICalEvent;
				} catch {
					return null;
				}
			})
		);

		const events: ICalEvent[] = eventResults.filter((e) => e !== null);

		const actor = hostProfile?.handle || did;
		const calendarName = `${hostProfile?.displayName || actor}'s RSVP Events`;
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
