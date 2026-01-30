import type { CardDefinition, ContentComponentProps } from '$lib/cards/types';
import type { Component } from 'svelte';
import DinoGameCard from './DinoGameCard.svelte';

export const DinoGameCardDefinition = {
	type: 'dino-game',
	contentComponent: DinoGameCard as unknown as Component<ContentComponentProps>,
	sidebarButtonText: 'Dino Game',
	allowSetColor: true,
	createNew: (card) => {
		card.w = 4;
		card.h = 4;
		card.mobileW = 8;
		card.mobileH = 6;
		card.cardData = {};
	},
	canHaveLabel: true
} as CardDefinition & { type: 'dino-game' };
