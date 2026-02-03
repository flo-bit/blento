import type { CardDefinition } from '../../types';
import ClockCard from './ClockCard.svelte';
import ClockCardSettings from './ClockCardSettings.svelte';

export type ClockCardData = {
	timezone?: string;
};

export const ClockCardDefinition = {
	type: 'clock',
	contentComponent: ClockCard,
	settingsComponent: ClockCardSettings,

	createNew: (card) => {
		card.w = 4;
		card.h = 2;
		card.mobileW = 8;
		card.mobileH = 3;
		card.cardData = {
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
		} as ClockCardData;
	},

	allowSetColor: true,
	name: 'Clock',
	minW: 4,
	canHaveLabel: true,
	groups: ['Utilities'],
	keywords: ['time', 'timezone', 'watch'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`
} as CardDefinition & { type: 'clock' };
