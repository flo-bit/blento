import type { CardDefinition } from '../types';
import ButtonCard from './ButtonCard.svelte';
import EditingButtonCard from './EditingButtonCard.svelte';
import ButtonCardSettings from './ButtonCardSettings.svelte';

export const ButtonCardDefinition: CardDefinition = {
	type: 'button',
	contentComponent: ButtonCard,
	editingContentComponent: EditingButtonCard,
	settingsComponent: ButtonCardSettings,
	sidebarButtonText: 'Button',

	createNew: (card) => {
		card.cardData = {
			text: 'Click me'
		};
		card.w = 2;
		card.h = 1;
		card.mobileW = 4;
		card.mobileH = 2;
	},

	defaultColor: 'transparent',
	allowSetColor: true,
	canHaveLabel: false,

	minW: 2,
	minH: 1,
	maxW: 8,
	maxH: 4
};
