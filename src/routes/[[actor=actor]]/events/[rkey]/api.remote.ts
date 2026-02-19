import { query, getRequestEvent } from '$app/server';
import { createCache, type CachedProfile } from '$lib/cache';
import { getBlentoOrBskyProfile, parseUri } from '$lib/atproto/methods';
import type { Did } from '@atcute/lexicons';

export type AttendeeInfo = {
	did: string;
	status: 'going' | 'interested';
	avatar?: string;
	name: string;
	handle?: string;
	url?: string;
};

export type EventAttendeesResult = {
	going: AttendeeInfo[];
	interested: AttendeeInfo[];
	goingCount: number;
	interestedCount: number;
};

export const fetchEventAttendees = query(
	'unchecked',
	async (eventUri: string): Promise<EventAttendeesResult> => {
		// 1. Fetch backlinks (RSVPs)
		const allRecords: Record<string, unknown> = {};
		let cursor: string | undefined;

		do {
			const params: Record<string, unknown> = {
				subject: eventUri,
				source: 'community.lexicon.calendar.rsvp:subject.uri'
			};
			if (cursor) params.cursor = cursor;

			const res = await fetch(
				'https://slingshot.microcosm.blue/xrpc/com.bad-example.proxy.hydrateQueryResponse',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						atproto_proxy: 'did:web:constellation.microcosm.blue#constellation',
						hydration_sources: [
							{
								path: 'records[]',
								shape: 'at-uri-parts'
							}
						],
						params,
						xrpc: 'blue.microcosm.links.getBacklinks'
					})
				}
			);

			if (!res.ok) break;

			const data = await res.json();
			const output = data.output;

			for (const [key, value] of Object.entries(data.records ?? {})) {
				allRecords[key] = value;
			}

			cursor = output.cursor || undefined;
		} while (cursor);

		// 2. Parse RSVPs and collect unique DIDs
		const going: string[] = [];
		const interested: string[] = [];

		for (const [uri, raw] of Object.entries(allRecords)) {
			console.log(uri, raw);
			const record = raw as { did?: string; value?: { status?: string } };
			// DID can be on the record directly or extracted from the AT URI key
			const parts = parseUri(uri);
			const repo = parts?.repo;
			if (!repo) continue;

			const status = record.value?.status || '';
			if (status.includes('#going')) {
				going.push(repo);
			} else if (status.includes('#interested')) {
				interested.push(repo);
			}
		}

		// 3. Fetch profiles for attendees (with caching)
		const uniqueDids = [...new Set([...going, ...interested])];
		const { platform } = getRequestEvent();
		const cache = createCache(platform);

		const profileMap = new Map<string, CachedProfile>();

		await Promise.all(
			uniqueDids.map(async (did) => {
				try {
					let profile: CachedProfile;
					if (cache) {
						profile = await cache.getProfile(did as Did);
					} else {
						const p = await getBlentoOrBskyProfile({ did: did as Did });
						profile = {
							did: p.did as string,
							handle: p.handle as string,
							displayName: p.displayName as string | undefined,
							avatar: p.avatar as string | undefined,
							hasBlento: p.hasBlento,
							url: p.url
						};
					}
					profileMap.set(did, profile);
				} catch {
					// skip failed profile fetches
				}
			})
		);

		function toAttendeeInfo(did: string, status: 'going' | 'interested'): AttendeeInfo {
			const profile = profileMap.get(did);
			const handle = profile?.handle;
			const url = profile?.hasBlento
				? profile.url || (handle ? `/${handle}` : undefined)
				: handle
					? `https://bsky.app/profile/${handle}`
					: `https://bsky.app/profile/${did}`;
			return {
				did,
				status,
				avatar: profile?.avatar,
				name: profile?.displayName || handle || did,
				handle,
				url
			};
		}

		return {
			going: going.map((did) => toAttendeeInfo(did, 'going')),
			interested: interested.map((did) => toAttendeeInfo(did, 'interested')),
			goingCount: going.length,
			interestedCount: interested.length
		};
	}
);
