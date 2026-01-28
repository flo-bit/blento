import { parseUri } from '$lib/atproto';
import type { CardDefinition } from '../types';
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
			ref?: {
				$link: string;
			};
			mimeType?: string;
		};
		aspect_ratio?: {
			width: number;
			height: number;
		};
	}>;
	countGoing?: number;
	countInterested?: number;
	url: string;
};

export const EventCardDefinition = {
	type: 'event',
	contentComponent: EventCard,
	creationModalComponent: CreateEventCardModal,
	sidebarButtonText: 'Event',

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

	name: 'Event Card'
} as CardDefinition & { type: 'event' };
