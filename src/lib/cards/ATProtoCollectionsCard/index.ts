import { describeRepo } from '$lib/atproto';
import type { CardDefinition } from '../types';
import ATProtoCollectionsCard from './ATProtoCollectionsCard.svelte';

export const ATProtoCollectionsCardDefinition = {
	type: 'atprotocollections',
	contentComponent: ATProtoCollectionsCard,
	loadData: async (items, { did }) => {
		const data = await describeRepo({ did });
		const collections = new Set<string>();
		for (const collection of data?.collections ?? []) {
			const split = collection.split('.');
			if (split.length > 1) collections.add(split[1] + '.' + split[0]);
		}

		return Array.from(collections);
	},
	createNew: (item) => {
		item.w = 4;
		item.mobileW = 8;
	},
	sidebarButtonText: 'Atmosphere Collections'
} as CardDefinition & { type: 'atprotocollections' };
