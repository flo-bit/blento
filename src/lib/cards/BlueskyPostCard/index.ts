import { AtpBaseClient } from '@atproto/api';
import type { CardDefinition } from '../types';
import BlueskyPostCard from './BlueskyPostCard.svelte';
import SidebarItemBlueskyPostCard from './SidebarItemBlueskyPostCard.svelte';

export const BlueskyPostCardDefinition = {
	type: 'latestPost',
	contentComponent: BlueskyPostCard,
	createNew: (card) => {
		card.cardType = 'latestPost';
		card.w = 4;
		card.mobileW = 8;
		card.h = 4;
		card.mobileH = 8;
	},
	sidebarComponent: SidebarItemBlueskyPostCard,
	loadData: async (items, { did }) => {
		const agent = new AtpBaseClient({ service: 'https://api.bsky.app' });
		const authorFeed = await agent.app.bsky.feed.getAuthorFeed({
			actor: did,
			filter: 'posts_no_replies',
			limit: 2
		});
		return JSON.parse(JSON.stringify(authorFeed.data));
	},
	minW: 4
} as CardDefinition & { type: 'latestPost' };
