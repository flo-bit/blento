import type { CardDefinition } from '../../types';
import CountdownCard from './CountdownCard.svelte';
import CountdownCardSettings from './CountdownCardSettings.svelte';

export type CountdownCardData = {
	targetDate?: string;
};

export const CountdownCardDefinition = {
	type: 'countdown',
	contentComponent: CountdownCard,
	settingsComponent: CountdownCardSettings,

	createNew: (card) => {
		card.w = 4;
		card.h = 2;
		card.mobileW = 8;
		card.mobileH = 3;
		card.cardData = {} as CountdownCardData;
	},

	allowSetColor: true,
	name: 'Countdown',
	minW: 4,
	canHaveLabel: true,
	groups: ['Utilities'],
	keywords: ['timer', 'event', 'date', 'countdown'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M19.5 4.5l-1.5 1.5M4.5 4.5l1.5 1.5M12 2.25V3.75M9 2.25h6" /></svg>`
} as CardDefinition & { type: 'countdown' };
