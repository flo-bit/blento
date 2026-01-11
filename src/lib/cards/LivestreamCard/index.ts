import { client } from '$lib/oauth';
import { listRecords } from '$lib/oauth/atproto';
import { getImageBlobUrl } from '$lib/website/utils';
import EmbedCard from '../EmbedCard/EmbedCard.svelte';
import type { CardDefinition } from '../types';
import LivestreamCard from './LivestreamCard.svelte';
import LivestreamEmbedCard from './LivestreamEmbedCard.svelte';
import SidebarItemEmbedLivestreamCard from './SidebarItemEmbedLivestreamCard.svelte';
import SidebarItemLivestreamCard from './SidebarItemLivestreamCard.svelte';

export const LivestreamCardDefitition = {
	type: 'latestLivestream',
	contentComponent: LivestreamCard,
	sidebarComponent: SidebarItemLivestreamCard,
	createNew: (card) => {
		card.w = 4;
		card.h = 4;
		card.mobileH = 8;
		card.mobileW = 8;
	},
	loadData: async (items, { did }) => {
		const records = await listRecords({ did, collection: 'place.stream.livestream', limit: 3 });

		let latestLivestream:
			| {
					createdAt: string;
					title: string;
					thumb?: string;
					href: string;
					online?: boolean;
			  }
			| undefined;
		const values = Object.values(records);
		if (values?.length > 0) {
			const latest = JSON.parse(JSON.stringify(values[0]));

			latestLivestream = {
				createdAt: latest.value.createdAt,
				title: latest.value.title as string,
				thumb: getImageBlobUrl({ link: latest.value.thumb?.ref.$link, did }),
				href: latest.value.canonicalUrl || latest.value.url,
				online: undefined
			};
		}

		if (latestLivestream) {
			try {
				const segmentsResponse = await fetch(
					'https://stream.place/xrpc/place.stream.live.getSegments?userDID=' +
						encodeURIComponent(did)
				);
				const segments = await segmentsResponse.json();

				const lastSegment = segments.segments[0];
				const startTime = new Date(lastSegment.record.startTime).getTime();

				const FIVE_MINUTES = 5 * 60 * 1000;
				const now = Date.now();

				latestLivestream.online = now - startTime <= FIVE_MINUTES;
			} catch (error) {
				console.error(error);
			}
		}

		return latestLivestream;
	}
} as CardDefinition & { type: 'latestLivestream' };

export const LivestreamEmbedCardDefitition = {
	type: 'livestreamEmbed',
	contentComponent: LivestreamEmbedCard,
	sidebarComponent: SidebarItemEmbedLivestreamCard,
	createNew: (card) => {
		card.w = 4;
		card.h = 2;
		card.mobileW = 8;
		card.mobileH = 4;

		card.cardData = {
			href: 'https://stream.place/embed/' + client.profile?.handle
		};
	}
} as CardDefinition & { type: 'livestreamEmbed' };
