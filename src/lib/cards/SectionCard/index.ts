import { COLUMNS } from '$lib';
import type { CardDefinition } from '../types';
import EditingSectionCard from './EditingSectionCard.svelte';
import SectionCard from './SectionCard.svelte';

export const SectionCardDefinition = {
	type: 'section',
	contentComponent: SectionCard,
	editingContentComponent: EditingSectionCard,
	createNew: (card) => {
		card.cardType = 'section';
		card.cardData = {
			text: 'hello world'
		};

		card.h = 1;
		card.mobileH = 2;

		card.w = COLUMNS;
		card.mobileW = COLUMNS;
	},

	sidebarButtonText: 'section',
	defaultColor: 'transparent',
	maxH: 1
} as CardDefinition & { type: 'section' };
