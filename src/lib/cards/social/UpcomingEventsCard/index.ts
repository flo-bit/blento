import type { CardDefinition } from '../../types';
import UpcomingEventsCard from './UpcomingEventsCard.svelte';
import type { Did } from '@atcute/lexicons';
import type { EventData } from '../EventCard';

const EVENT_COLLECTION = 'community.lexicon.calendar.event';

export const UpcomingEventsCardDefinition = {
	type: 'upcomingEvents',
	contentComponent: UpcomingEventsCard,
	createNew: (card) => {
		card.w = 4;
		card.h = 4;
		card.mobileW = 8;
		card.mobileH = 6;
	},
	minW: 2,
	minH: 3,

	loadData: async (_items, { did }) => {
		const { listRecords } = await import('$lib/atproto/methods');
		const records = await listRecords({
			did: did as Did,
			collection: EVENT_COLLECTION,
			limit: 100
		});

		const now = new Date();
		const events: Array<EventData & { rkey: string }> = [];

		for (const record of records) {
			const event = record.value as EventData;
			const endsAt = event.endsAt ? new Date(event.endsAt) : null;
			const startsAt = new Date(event.startsAt);

			if ((endsAt && endsAt >= now) || (!endsAt && startsAt >= now)) {
				const uri = record.uri as string;
				const rkey = uri.split('/').pop() || '';
				events.push({ ...event, rkey });
			}
		}

		events.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

		return { events };
	},

	name: 'Upcoming Events',
	keywords: ['events', 'hosting', 'calendar', 'upcoming'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg>`
} as CardDefinition & { type: 'upcomingEvents' };
