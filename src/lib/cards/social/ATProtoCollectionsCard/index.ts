import { describeRepo } from '$lib/atproto';
import type { CardDefinition } from '../../types';
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
	name: 'ATProto Collections',

	keywords: ['bluesky', 'records', 'pds', 'data'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>`
} as CardDefinition & { type: 'atprotocollections' };
