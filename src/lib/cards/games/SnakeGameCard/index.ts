import type { CardDefinition, ContentComponentProps } from '$lib/cards/types';
import type { Component } from 'svelte';
import SnakeGameCard from './SnakeGameCard.svelte';

export const SnakeGameCardDefinition = {
	type: 'snake-game',
	contentComponent: SnakeGameCard as unknown as Component<ContentComponentProps>,
	allowSetColor: true,
	createNew: (card) => {
		card.w = 4;
		card.h = 3;
		card.mobileW = 8;
		card.mobileH = 8;
		card.cardData = {};
	},
	canHaveLabel: false,

	keywords: ['snake', 'arcade', 'retro', 'game'],
	groups: ['Games'],
	name: 'Snake',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M18 6h-5a3 3 0 1 0 0 6h4a3 3 0 1 1 0 6H6m12-12v3m0 9v-3M9 9h.01M15 15h.01" /></svg>`
} as CardDefinition & { type: 'snake-game' };
