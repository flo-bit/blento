import type { CardDefinition } from '../types';
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
	},
	sidebarButtonText: 'Latest Bluesky Post',
	loadData: async (items, { did }) => {
		const authorFeed = await getAuthorFeed({ did, filter: 'posts_no_replies', limit: 2 });

		return JSON.parse(JSON.stringify(authorFeed));
	},
	minW: 4
} as CardDefinition & { type: 'latestPost' };
