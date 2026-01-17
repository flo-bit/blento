import type { CardDefinition } from '../types';
import BlueskyProfileCard from './BlueskyProfileCard.svelte';

export const BlueskyProfileCardDefinition = {
	type: 'blueskyProfile',
	contentComponent: BlueskyProfileCard,
	createNew: (card) => {
		// card.w = 4;
		// card.mobileW = 8;
		// card.h = 4;
		// card.mobileH = 8;
	}
} as CardDefinition & { type: 'blueskyProfile' };
