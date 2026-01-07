import type { CardDefinition } from '../types';
import BlueskyPostCard from './BlueskyPostCard.svelte';
import SidebarItemBlueskyPostCard from './SidebarItemBlueskyPostCard.svelte';

export const BlueskyPostCardDefinition = {
	type: 'latestPost',
	contentComponent: BlueskyPostCard,
	createNew: (card) => {
		card.cardType = 'latestPost';
		card.w = 2;
		card.mobileW = 4;
		card.h = 2;
		card.mobileH = 4;
	},
	sidebarComponent: SidebarItemBlueskyPostCard
} as CardDefinition & { type: 'latestPost' };
