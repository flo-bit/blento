import type { CardDefinition } from '../types';
import TetrisCard from './TetrisCard.svelte';
import SidebarItemTetrisCard from './SidebarItemTetrisCard.svelte';

export const TetrisCardDefinition = {
	type: 'tetris',
	contentComponent: TetrisCard,
	sidebarComponent: SidebarItemTetrisCard,
	allowSetColor: true,
	defaultColor: 'accent',
	createNew: (card) => {
		card.w = 4;
		card.h = 6;
		card.mobileW = 6;
		card.mobileH = 8;
		card.cardData = {};
	}
} as CardDefinition & { type: 'tetris' };
