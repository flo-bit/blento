import ListenBrainzTopSongsCard from './ListenBrainzTopSongsCard.svelte';
import CreateListenBrainzCardModal from '../CreateListenBrainzCardModal.svelte';
import { fetchListenBrainzTopSongs } from './recordings.remote';
import type { CardDefinition } from '../../../types';

export const ListenBrainzTopSongsCardDefinition = {
	type: 'listenbrainzTopSongs',
	contentComponent: ListenBrainzTopSongsCard,
	creationModalComponent: CreateListenBrainzCardModal,
	createNew: (card) => {
		card.w = 4;
		card.mobileW = 8;
		card.h = 3;
		card.mobileH = 6;
	},
	loadData: async (items) => {
		const allData: Record<string, unknown> = {};
		for (const item of items) {
			const username = item.cardData.username;
			if (!username) continue;
			try {
				const data = await fetchListenBrainzTopSongs(username);
				if (data) allData[`listenBrainzTopSongs:${username}`] = data ?? [];
			} catch (error) {
				console.error('Failed to fetch ListenBrainz top songs:', error);
			}
		}
		return allData;
	},
	loadDataServer: async (items) => {
		const allData: Record<string, unknown> = {};
		for (const item of items) {
			const username = item.cardData.username;
			if (!username) continue;
			try {
				const data = await fetchListenBrainzTopSongs(username);
				if (data) allData[`listenBrainzTopSongs:${username}`] = data ?? [];
			} catch (error) {
				console.error('Failed to fetch ListenBrainz top songs:', error);
			}
		}
		return allData;
	},
	minW: 3,
	minH: 2,
	canHaveLabel: true,
	name: 'ListenBrainz Top Songs',
	keywords: ['music', 'scrobble', 'songs', 'listenbrainz', 'brainz', 'top'],
	groups: ['Media'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" /></svg>`
} as CardDefinition & { type: 'listenbrainzTopSongs' };
