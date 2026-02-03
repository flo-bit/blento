import type { CardDefinition } from '../../types';
import LatestBlueskyPostCard from './LatestBlueskyPostCard.svelte';
import { getAuthorFeed } from '$lib/atproto/methods';

export const LatestBlueskyPostCardDefinition = {
	type: 'latestPost',
	contentComponent: LatestBlueskyPostCard,
	createNew: (card) => {
		card.cardType = 'latestPost';
		card.w = 4;
		card.mobileW = 8;
		card.h = 4;
		card.mobileH = 8;

		card.cardData.label = '';
	},
	loadData: async (items, { did }) => {
		const authorFeed = await getAuthorFeed({ did, filter: 'posts_no_replies', limit: 2 });

		return JSON.parse(JSON.stringify(authorFeed));
	},
	minW: 4,

	name: 'Latest Bluesky Post',

	canHaveLabel: true,

	keywords: ['bsky', 'atproto', 'recent', 'feed'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4"><path d="M6.335 3.836a47.2 47.2 0 0 1 5.354 4.94c.088.093.165.18.232.26a18 18 0 0 1 .232-.26 47.2 47.2 0 0 1 5.355-4.94C18.882 2.687 21.46 1.37 22.553 2.483c.986 1.003.616 4.264.305 5.857-.567 2.902-2.018 4.274-3.703 4.542 2.348.386 4.678 1.96 3.13 5.602-1.97 4.636-7.065 1.763-9.795-.418a3 3 0 0 1-.18-.15 3 3 0 0 1-.18.15c-2.73 2.18-7.825 5.054-9.795.418-1.548-3.643.782-5.216 3.13-5.602C3.98 12.631 2.529 11.26 1.962 8.357c-.311-1.593-.681-4.854.305-5.857C3.361 1.37 5.94 2.687 6.335 3.836Z" /></svg>`,

	migrate: (item) => {
		if (item.cardData.label === undefined) {
			item.cardData.label = 'My latest bluesky post';
		}
	}
} as CardDefinition & { type: 'latestPost' };
