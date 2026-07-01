import type { CardDefinition } from '../../../types';
import CreateLastFMCardModal from '../CreateLastFMCardModal.svelte';
import LastFMPeriodSettings from '../LastFMPeriodSettings.svelte';
import LastFMTopTracksCard from './LastFMTopTracksCard.svelte';
import { fetchLastFM } from '../api.remote';

export const LastFMTopTracksCardDefinition = {
	type: 'lastfmTopTracks',
	contentComponent: LastFMTopTracksCard,
	creationModalComponent: CreateLastFMCardModal,
	settingsComponent: LastFMPeriodSettings,
	createNew: (card) => {
		card.w = 4;
		card.mobileW = 8;
		card.h = 3;
		card.mobileH = 6;
		card.cardData.period = '7day';
	},
	loadData: async (items) => {
		const allData: Record<string, unknown> = {};
		for (const item of items) {
			const username = item.cardData.lastfmUsername;
			const period = item.cardData.period ?? '7day';
			if (!username) continue;
			try {
				const data = await fetchLastFM({ method: 'user.getTopTracks', user: username, period });
				if (data) allData[`lastfmTopTracks:${username}:${period}`] = data?.toptracks?.track ?? [];
			} catch (error) {
				console.error('Failed to fetch Last.fm top tracks:', error);
			}
		}
		return allData;
	},
	loadDataServer: async (items) => {
		const allData: Record<string, unknown> = {};
		for (const item of items) {
			const username = item.cardData.lastfmUsername;
			const period = item.cardData.period ?? '7day';
			if (!username) continue;
			try {
				const data = await fetchLastFM({ method: 'user.getTopTracks', user: username, period });
				if (data) allData[`lastfmTopTracks:${username}:${period}`] = data?.toptracks?.track ?? [];
			} catch (error) {
				console.error('Failed to fetch Last.fm top tracks:', error);
			}
		}
		return allData;
	},
	minW: 3,
	minH: 2,
	canHaveLabel: true,
	name: 'Last.fm Top Tracks',
	keywords: ['music', 'scrobble', 'songs', 'lastfm', 'last.fm', 'top'],
	groups: ['Media'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" /></svg>`
} as CardDefinition & { type: 'lastfmTopTracks' };
