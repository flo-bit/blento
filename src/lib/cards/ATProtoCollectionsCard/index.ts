import { describeRepo } from '$lib/oauth/atproto';
import type { CardDefinition } from '../types';
import ATProtoCollectionsCard from './ATProtoCollectionsCard.svelte';
import SidebarItemATProtoCollectionsCard from './SidebarItemATProtoCollectionsCard.svelte';

export const ATProtoCollectionsCardDefinition = {
	type: 'atprotocollections',
	contentComponent: ATProtoCollectionsCard,
	loadData: async (items, { did }) => {
		const data = (await describeRepo({ did })).data;
		const collections = new Set<string>();
		for (const collection of data.collections) {
			const split = collection.split('.');
			if (split.length > 1) collections.add(split[1] + '.' + split[0]);
		}

		return Array.from(collections);
	},
	createNew: (item) => {
		item.w = 4;
		item.mobileW = 8;
	},
	sidebarComponent: SidebarItemATProtoCollectionsCard
} as CardDefinition & { type: 'atprotocollections' };
