import type { CardDefinition } from '../../types';
import ButtonCard from './ButtonCard.svelte';
import EditingButtonCard from './EditingButtonCard.svelte';
import ButtonCardSettings from './ButtonCardSettings.svelte';

export const ButtonCardDefinition: CardDefinition = {
	type: 'button',
	contentComponent: ButtonCard,
	editingContentComponent: EditingButtonCard,
	settingsComponent: ButtonCardSettings,
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
	maxH: 4,

	keywords: ['cta', 'action', 'click', 'link'],
	groups: ['Utilities'],
	name: 'Button',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" /></svg>`
};
