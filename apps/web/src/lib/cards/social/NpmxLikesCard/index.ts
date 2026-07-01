import type { CardDefinition } from '../../types';
import { listRecords } from '$lib/atproto';
import NpmxLikesCard from './NpmxLikesCard.svelte';

export const NpmxLikesCardDefinition = {
	type: 'npmxLikes',
	contentComponent: NpmxLikesCard,
	createNew: (card) => {
		card.w = 4;
		card.mobileW = 8;
		card.h = 3;
		card.mobileH = 6;
	},
	loadData: async (items, { did }) => {
		const data = await listRecords({
			did,
			collection: 'dev.npmx.feed.like',
			limit: 99
		});

		return data;
	},
	minW: 4,
	canHaveLabel: true,

	keywords: ['npm', 'package', 'npmx', 'likes'],
	name: 'npmx Likes',

	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>`
} as CardDefinition & { type: 'npmxLikes' };
