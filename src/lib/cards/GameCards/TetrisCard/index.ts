//Music by DJARTMUSIC - The Return Of The 8-bit Era
//https://pixabay.com/de/music/videospiele-the-return-of-the-8-bit-era-301292/

import type { CardDefinition, ContentComponentProps } from '../../types';
import TetrisCard from './TetrisCard.svelte';
import type { Component } from 'svelte';

export const TetrisCardDefinition = {
	type: 'tetris',
	contentComponent: TetrisCard as unknown as Component<ContentComponentProps>,
	allowSetColor: true,
	createNew: (card) => {
		card.w = 2;
		card.h = 4;
		card.mobileW = 8;
		card.mobileH = 12;
		card.cardData = {};
	},
	maxH: 10,
	canHaveLabel: true,

	keywords: ['blocks', 'puzzle', 'game', 'fun'],
	groups: ['Games'],

	name: 'Tetris',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14 4h-4v4H6v4h4v4h4v-4h4V8h-4V4Z" /></svg>`
} as CardDefinition & { type: 'tetris' };
