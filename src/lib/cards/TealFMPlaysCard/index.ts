import type { CardDefinition } from '../types';
import { listRecords } from '$lib/oauth/atproto';
import TealFMPlaysCard from './TealFMPlaysCard.svelte';

export const TealFMPlaysCardDefinition = {
	type: 'recentTealFMPlays',
	contentComponent: TealFMPlaysCard,
	createNew: (card) => {
		card.w = 4;
		card.mobileW = 8;
		card.h = 3;
		card.mobileH = 6;
	},
	loadData: async (items, { did }) => {
		const data = await listRecords({
			did,
			collection: 'fm.teal.alpha.feed.play',
			limit: 99
		});

		return data;
	},
	minW: 4,
	sidebarButtonText: 'teal.fm Plays'
} as CardDefinition & { type: 'recentTealFMPlays' };
