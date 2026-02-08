import type { CardDefinition } from '../../../types';
import CreateLastFMCardModal from '../CreateLastFMCardModal.svelte';
import LastFMRecentTracksCard from './LastFMRecentTracksCard.svelte';
import { fetchLastFM } from '../api.remote';

export const LastFMRecentTracksCardDefinition = {
	type: 'lastfmRecentTracks',
	contentComponent: LastFMRecentTracksCard,
	creationModalComponent: CreateLastFMCardModal,
	createNew: (card) => {
		card.w = 4;
		card.mobileW = 8;
		card.h = 3;
		card.mobileH = 6;
	},
	loadData: async (items) => {
		const allData: Record<string, unknown> = {};
		for (const item of items) {
			const username = item.cardData.lastfmUsername;
			if (!username) continue;
			try {
				const data = await fetchLastFM({ method: 'user.getRecentTracks', user: username });
				if (data) allData[`lastfmRecentTracks:${username}`] = data?.recenttracks?.track ?? [];
			} catch (error) {
				console.error('Failed to fetch Last.fm recent tracks:', error);
			}
		}
		return allData;
	},
	loadDataServer: async (items) => {
		const allData: Record<string, unknown> = {};
		for (const item of items) {
			const username = item.cardData.lastfmUsername;
			if (!username) continue;
			try {
				const data = await fetchLastFM({ method: 'user.getRecentTracks', user: username });
				if (data) allData[`lastfmRecentTracks:${username}`] = data?.recenttracks?.track ?? [];
			} catch (error) {
				console.error('Failed to fetch Last.fm recent tracks:', error);
			}
		}
		return allData;
	},
	onUrlHandler: (url, item) => {
		const username = getLastFMUsername(url);
		if (!username) return null;

		item.cardData.lastfmUsername = username;
		item.cardData.href = `https://www.last.fm/user/${username}`;
		item.w = 4;
		item.mobileW = 8;
		item.h = 3;
		item.mobileH = 6;
		item.cardType = 'lastfmRecentTracks';
		return item;
	},
	urlHandlerPriority: 5,
	minW: 3,
	minH: 2,
	canHaveLabel: true,
	name: 'Last.fm Recent Tracks',
	keywords: ['music', 'scrobble', 'listening', 'songs', 'lastfm', 'last.fm'],
	groups: ['Media'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" /></svg>`
} as CardDefinition & { type: 'lastfmRecentTracks' };

function getLastFMUsername(url: string | undefined): string | undefined {
	if (!url) return;
	try {
		const parsed = new URL(url);
		if (!/^(www\.)?last\.fm$/.test(parsed.hostname)) return undefined;
		const segments = parsed.pathname.split('/').filter(Boolean);
		if (segments.length >= 2 && segments[0] === 'user') {
			return segments[1];
		}
		return undefined;
	} catch {
		return undefined;
	}
}
