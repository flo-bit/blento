//Music by DJARTMUSIC - The Return Of The 8-bit Era
//https://pixabay.com/de/music/videospiele-the-return-of-the-8-bit-era-301292/

import type { CardDefinition, ContentComponentProps } from '../../types';
import TetrisCard from './TetrisCard.svelte';
import type { Component } from 'svelte';

export const TetrisCardDefinition = {
	type: 'tetris',
	contentComponent: TetrisCard as unknown as Component<ContentComponentProps>,
	sidebarButtonText: 'Tetris',
	allowSetColor: true,
	defaultColor: 'accent',
	createNew: (card) => {
		card.w = 4;
		card.h = 6;
		card.mobileW = 8;
		card.mobileH = 12;
		card.cardData = {};
	},
	maxH: 10,
	canHaveLabel: true
} as CardDefinition & { type: 'tetris' };
