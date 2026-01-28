import type { CardDefinition } from '../types';
import TimerCard from './TimerCard.svelte';
import TimerCardSettings from './TimerCardSettings.svelte';

export type TimerMode = 'clock' | 'event';

export type TimerCardData = {
	mode: TimerMode;
	label?: string;
	// For clock mode
	timezone?: string;
	// For event mode: target date as ISO string
	targetDate?: string;
};

export const TimerCardDefinition = {
	type: 'timer',
	contentComponent: TimerCard,
	settingsComponent: TimerCardSettings,
	sidebarButtonText: 'Timer',

	createNew: (card) => {
		card.w = 4;
		card.h = 2;
		card.mobileW = 8;
		card.mobileH = 3;
		card.cardData = {
			mode: 'clock',
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
		} as TimerCardData;
	},

	allowSetColor: true,
	name: 'Timer Card',
	minW: 4,
	canHaveLabel: true
} as CardDefinition & { type: 'timer' };
