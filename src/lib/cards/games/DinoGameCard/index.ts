import type { CardDefinition, ContentComponentProps } from '$lib/cards/types';
import type { Component } from 'svelte';
import DinoGameCard from './DinoGameCard.svelte';

export const DinoGameCardDefinition = {
	type: 'dino-game',
	contentComponent: DinoGameCard as unknown as Component<ContentComponentProps>,
	allowSetColor: true,
	createNew: (card) => {
		card.w = 4;
		card.h = 2;
		card.mobileW = 8;
		card.mobileH = 4;
		card.cardData = {};
	},
	canHaveLabel: true,

	keywords: ['chrome', 'dinosaur', 'runner', 'fun'],
	groups: ['Games'],
	name: 'Dino Game',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.491 48.491 0 0 1-4.163-.3c-1.228-.158-2.33.895-2.33 2.134v0c0 1.26 1.09 2.22 2.34 2.14a48.089 48.089 0 0 1 3.27-.108c.43 0 .78.348.78.78v0c0 .22-.09.422-.234.577a8.398 8.398 0 0 0-2.07 4.238c-.19 1.14.513 2.163 1.578 2.428a2.07 2.07 0 0 0 2.478-1.41c.203-.636.37-1.294.524-1.947.128-.537.612-.898 1.16-.84 1.378.15 2.782.18 4.17.076 1.156-.087 2.03-1.09 1.883-2.24a8.52 8.52 0 0 0-1.568-3.7A2.01 2.01 0 0 1 18 8.053v0c0-1.064.82-1.98 1.88-2.08A48.678 48.678 0 0 0 24 5.328v0" /></svg>`
} as CardDefinition & { type: 'dino-game' };
