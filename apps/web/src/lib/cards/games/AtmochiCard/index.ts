import type { CardDefinition } from '../../types';
import { getRecord } from '$lib/atproto';
import { create as createTid } from '@atcute/tid';
import AtmochiCard from './AtmochiCard.svelte';
import CreateAtmochiCardModal from './CreateAtmochiCardModal.svelte';

export type AtmochiData = {
	// at:// uri of the pet's web tile (https://webtil.es)
	uri: string;
	name: string;
} | null;

export const AtmochiCardDefinition = {
	type: 'atmochi',
	contentComponent: AtmochiCard,
	creationModalComponent: CreateAtmochiCardModal,

	createNew: (item) => {
		item.w = 4;
		item.h = 3;
		item.mobileW = 8;
		item.mobileH = 6;
	},

	loadData: async (_items, { did }) => {
		try {
			const pet = await getRecord({
				did,
				collection: 'dev.arigonzalez.atmochi.pet',
				rkey: 'self'
			});
			const hatchedAt = Date.parse(
				(pet?.value as { hatchedAt?: string } | undefined)?.hatchedAt ?? ''
			);
			if (Number.isNaN(hatchedAt)) return null;

			// atmochi publishes the tile under a TID derived from the pet's hatch time
			const rkey = createTid(hatchedAt * 1000, 0);
			const tile = await getRecord({ did, collection: 'ing.dasl.masl', rkey });
			const name = (tile?.value as { tile?: { name?: string } } | undefined)?.tile?.name;
			return {
				uri: `at://${did}/ing.dasl.masl/${rkey}`,
				name: name ?? 'Atmochi'
			} satisfies AtmochiData;
		} catch {
			return null;
		}
	},
	cacheLoadData: { ttl: 300 },

	minW: 2,
	minH: 2,

	name: 'Atmochi',
	keywords: ['atmochi', 'pet', 'web tile', 'webtile', 'game'],
	groups: ['Games'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5v-6a7.5 7.5 0 0 1 15 0v6a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5ZM9.375 13.5h.008v.008h-.008V13.5Zm5.25 0h.008v.008h-.008V13.5Z" /></svg>`
} as CardDefinition & { type: 'atmochi' };
