import type { CardDefinition } from '../../types';
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

	keywords: ['stopwatch', 'clock', 'time'],
	allowSetColor: true,
	minW: 4,
	canHaveLabel: true,

	migrate: (item) => {
		const data = item.cardData as TimerCardData;
		if (data.mode === 'event') {
			item.cardType = 'countdown';
			item.cardData = { targetDate: data.targetDate };
		} else {
			item.cardType = 'clock';
			item.cardData = { timezone: data.timezone };
		}
		if (data.label) {
			item.cardData.label = data.label;
		}
	}
} as CardDefinition & { type: 'timer' };
