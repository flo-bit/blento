import type { CardDefinition } from '../../types';
import UpcomingRsvpsCard from './UpcomingRsvpsCard.svelte';
import type { ResolvedRsvp } from '$lib/events/fetch-attendees';

export type { ResolvedRsvp };

export const UpcomingRsvpsCardDefinition = {
	type: 'upcomingRsvps',
	contentComponent: UpcomingRsvpsCard,
	createNew: (card) => {
		card.w = 4;
		card.h = 4;
		card.mobileW = 8;
		card.mobileH = 6;
	},
	minW: 2,
	minH: 3,

	loadData: async (_items, { did, cache }) => {
		const { fetchUserRsvps } = await import('$lib/events/fetch-attendees');
		const rsvps = await fetchUserRsvps(did, cache);

		const now = new Date();
		const upcoming = rsvps.filter((r) => {
			const endsAt = r.event.endsAt ? new Date(r.event.endsAt) : null;
			const startsAt = new Date(r.event.startsAt);
			return (endsAt && endsAt >= now) || (!endsAt && startsAt >= now);
		});

		upcoming.sort(
			(a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime()
		);

		return { rsvps: upcoming };
	},

	name: 'Upcoming RSVPs',
	keywords: ['rsvp', 'attending', 'going', 'interested', 'events'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`
} as CardDefinition & { type: 'upcomingRsvps' };
