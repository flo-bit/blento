import type { CardDefinition } from '../../types';
import { listRecords } from '$lib/atproto';
import MarginCard from './MarginCard.svelte';
import MarginCardSettings from './MarginCardSettings.svelte';

export type MarginEntry = {
	type: 'bookmark' | 'annotation' | 'highlight';
	uri: string;
	value: any;
	createdAt: string;
};

export const MarginCardDefinition = {
	type: 'margin',
	contentComponent: MarginCard,
	settingsComponent: MarginCardSettings,
	createNew: (card) => {
		card.w = 4;
		card.mobileW = 8;
		card.h = 4;
		card.mobileH = 6;
	},
	loadData: async (_items, { did }) => {
		const [bookmarks, annotations, highlights] = await Promise.all([
			listRecords({ did, collection: 'at.margin.bookmark' }).catch(() => []),
			listRecords({ did, collection: 'at.margin.annotation' }).catch(() => []),
			listRecords({ did, collection: 'at.margin.highlight' }).catch(() => [])
		]);

		const entries: MarginEntry[] = [
			...bookmarks.map((r: any) => ({
				type: 'bookmark' as const,
				uri: r.uri,
				value: r.value,
				createdAt: r.value.createdAt
			})),
			...annotations.map((r: any) => ({
				type: 'annotation' as const,
				uri: r.uri,
				value: r.value,
				createdAt: r.value.createdAt
			})),
			...highlights.map((r: any) => ({
				type: 'highlight' as const,
				uri: r.uri,
				value: r.value,
				createdAt: r.value.createdAt
			}))
		];

		entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return entries;
	},
	minH: 2,
	canHaveLabel: true,

	keywords: ['margin', 'bookmarks', 'annotations', 'highlights', 'reading', 'web'],
	groups: ['Social'],
	name: 'Margin highlights, bookmarks, annotations',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>`
} as CardDefinition & { type: 'margin' };
