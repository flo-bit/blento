import { parseUri } from '$lib/atproto';
import type { CardDefinition } from '../../types';
import CreateEventCardModal from './CreateEventCardModal.svelte';
import EventCard from './EventCard.svelte';

const EVENT_COLLECTION = 'community.lexicon.calendar.event';

export type EventData = {
	mode: string;
	name: string;
	status: string;
	startsAt: string;
	endsAt?: string;
	description?: string;
	locations?: Array<{
		$type: string;
		address?: {
			locality?: string;
			region?: string;
			country?: string;
		};
	}>;
	media?: Array<{
		alt?: string;
		role?: string;
		content?: {
			$type: 'blob';
			ref: {
				$link: string;
			};
			mimeType?: string;
		};
		aspect_ratio?: {
			width: number;
			height: number;
		};
	}>;
	uris?: Array<{
		uri: string;
		name?: string;
	}>;
	countGoing?: number;
	countInterested?: number;
	url: string;
};

export const EventCardDefinition = {
	type: 'event',
	contentComponent: EventCard,
	creationModalComponent: CreateEventCardModal,
	createNew: (card) => {
		card.w = 4;
		card.h = 4;
		card.mobileW = 8;
		card.mobileH = 6;
	},

	loadData: async (items) => {
		const eventDataMap: Record<string, EventData> = {};

		for (const item of items) {
			const uri = item.cardData?.uri;
			if (!uri) continue;

			const parsedUri = parseUri(uri);
			if (!parsedUri || !parsedUri.rkey || !parsedUri.repo) continue;

			try {
				const response = await fetch(
					`https://smokesignal.events/xrpc/community.lexicon.calendar.GetEvent?repository=${encodeURIComponent(parsedUri.repo)}&record_key=${encodeURIComponent(parsedUri.rkey)}`
				);

				if (response.ok) {
					const data = await response.json();
					eventDataMap[item.id] = data as EventData;
				}
			} catch (error) {
				console.error('Failed to fetch event data:', error);
			}
		}

		return eventDataMap;
	},

	onUrlHandler: (url, item) => {
		// Match smokesignal.events URLs: https://smokesignal.events/{did}/{rkey}
		const smokesignalMatch = url.match(/^https?:\/\/smokesignal\.events\/(did:[^/]+)\/([^/?#]+)/);
		if (smokesignalMatch) {
			const [, did, rkey] = smokesignalMatch;
			item.w = 4;
			item.h = 4;
			item.mobileW = 8;
			item.mobileH = 6;
			item.cardType = 'event';
			item.cardData.uri = `at://${did}/${EVENT_COLLECTION}/${rkey}`;
			return item;
		}

		// Match AT URIs: at://{did}/community.lexicon.calendar.event/{rkey}
		const atUriMatch = url.match(/^at:\/\/(did:[^/]+)\/([^/]+)\/([^/?#]+)/);
		if (atUriMatch) {
			const [, did, collection, rkey] = atUriMatch;
			if (collection === EVENT_COLLECTION) {
				item.w = 4;
				item.h = 4;
				item.mobileW = 8;
				item.mobileH = 6;
				item.cardType = 'event';
				item.cardData.uri = `at://${did}/${collection}/${rkey}`;
				return item;
			}
		}

		return null;
	},

	urlHandlerPriority: 5,

	name: 'Event',

	keywords: ['calendar', 'meetup', 'schedule', 'date', 'rsvp'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>`
} as CardDefinition & { type: 'event' };
