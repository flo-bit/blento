import { user, listRecords, getCDNImageBlobUrl } from '$lib/atproto';
import type { CardDefinition } from '../types';
import LivestreamCard from './LivestreamCard.svelte';
import LivestreamEmbedCard from './LivestreamEmbedCard.svelte';

export const LivestreamCardDefitition = {
	type: 'latestLivestream',
	contentComponent: LivestreamCard,
	sidebarButtonText: 'stream.place info',
	createNew: (card) => {
		card.w = 4;
		card.h = 4;
		card.mobileH = 8;
		card.mobileW = 8;

		card.cardType = 'latestLivestream';
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

		if (records?.length) {
			const latest = JSON.parse(JSON.stringify(records?.[0]));

			latestLivestream = {
				createdAt: latest.value.createdAt,
				title: latest.value?.title as string,
				thumb: latest.value?.thumb?.ref?.$link
					? getCDNImageBlobUrl({ blob: latest.value.thumb, did })
					: undefined,
				href: latest.value?.canonicalUrl || latest.value.url,
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
	},

	onUrlHandler: (url, item) => {
		console.log(url, 'https://stream.place/' + user.profile?.handle);
		if (url === 'https://stream.place/' + user.profile?.handle) {
			item.w = 4;
			item.h = 4;
			item.mobileH = 8;
			item.mobileW = 8;
			item.cardData.href = 'https://stream.place/' + user.profile?.handle;
			return item;
		}
	},

	canChange: (item) => item.cardData.href === 'https://stream.place/' + user.profile?.handle,

	urlHandlerPriority: 5,

	name: 'stream.place Card'
} as CardDefinition & { type: 'latestLivestream' };

export const LivestreamEmbedCardDefitition = {
	type: 'livestreamEmbed',
	contentComponent: LivestreamEmbedCard,
	createNew: (card) => {
		card.w = 4;
		card.h = 2;
		card.mobileW = 8;
		card.mobileH = 4;

		card.cardData = {
			href: 'https://stream.place/' + user.profile?.handle,
			embed: 'https://stream.place/embed/' + user.profile?.handle
		};
	}
	// canChange: (item) => item.cardData.href === 'https://stream.place/' + client.profile?.handle,

	// change: (item) => {
	// 	item.cardData.embed = 'https://stream.place/embed/' + client.profile?.handle;
	// },
} as CardDefinition & { type: 'livestreamEmbed' };
