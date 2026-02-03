import type { CardDefinition } from '../../types';
import { listRecords } from '$lib/atproto';
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
	canHaveLabel: true,

	keywords: ['music', 'scrobble', 'listening', 'songs'],
	name: 'Teal.fm Plays',

	groups: ['Media'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" /></svg>`
} as CardDefinition & { type: 'recentTealFMPlays' };
