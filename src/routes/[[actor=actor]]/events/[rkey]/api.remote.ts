import { query, getRequestEvent } from '$app/server';
import { createCache } from '$lib/cache';
import { fetchEventRsvps, resolveProfile } from '$lib/events/fetch-attendees';

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
		const rsvpMap = await fetchEventRsvps(eventUri);

		const going: string[] = [];
		const interested: string[] = [];
		for (const [did, status] of rsvpMap) {
			if (status === 'going') going.push(did);
			else interested.push(did);
		}

		// Fetch profiles for attendees (with caching)
		const uniqueDids = [...new Set([...going, ...interested])];
		const { platform } = getRequestEvent();
		const cache = createCache(platform);

		const profileMap = new Map<
			string,
			{ handle?: string; displayName?: string; avatar?: string; hasBlento?: boolean; url?: string }
		>();

		await Promise.all(
			uniqueDids.map(async (did) => {
				const profile = await resolveProfile(did, cache).catch(() => null);
				if (profile) profileMap.set(did, profile);
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
