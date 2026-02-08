import type { CardDefinition } from '../../../types';
import CreateLastFMCardModal from '../CreateLastFMCardModal.svelte';
import LastFMProfileCard from './LastFMProfileCard.svelte';

export const LastFMProfileCardDefinition = {
	type: 'lastfmProfile',
	contentComponent: LastFMProfileCard,
	creationModalComponent: CreateLastFMCardModal,
	createNew: (card) => {
		card.w = 4;
		card.mobileW = 8;
		card.h = 2;
		card.mobileH = 3;
	},
	loadData: async (items) => {
		const allData: Record<string, unknown> = {};
		for (const item of items) {
			const username = item.cardData.lastfmUsername;
			if (!username) continue;
			try {
				const response = await fetch(
					`https://blento.app/api/lastfm?method=user.getInfo&user=${encodeURIComponent(username)}`
				);
				if (!response.ok) continue;
				const text = await response.text();
				const result = JSON.parse(text);
				allData[`lastfmProfile:${username}`] = result?.user;
			} catch (error) {
				console.error('Failed to fetch Last.fm profile:', error);
			}
		}
		return allData;
	},
	loadDataServer: async (items, { cache, env }) => {
		const apiKey = env?.LASTFM_API_KEY;
		if (!apiKey) return {};
		const allData: Record<string, unknown> = {};
		for (const item of items) {
			const username = item.cardData.lastfmUsername;
			if (!username) continue;
			try {
				const cacheKey = `user.getInfo:${username}:7day:50`;
				const cached = await cache?.get('lastfm', cacheKey);
				if (cached) {
					allData[`lastfmProfile:${username}`] = JSON.parse(cached)?.user;
					continue;
				}
				const params = new URLSearchParams({
					method: 'user.getInfo',
					user: username,
					api_key: apiKey,
					format: 'json',
					limit: '50'
				});
				const response = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
				if (!response.ok) continue;
				const data = await response.json();
				if (data.error) continue;
				await cache?.put('lastfm', cacheKey, JSON.stringify(data), 12 * 60 * 60);
				allData[`lastfmProfile:${username}`] = data?.user;
			} catch (error) {
				console.error('Failed to fetch Last.fm profile:', error);
			}
		}
		return allData;
	},
	minW: 2,
	minH: 2,
	name: 'Last.fm Profile',
	keywords: ['music', 'scrobble', 'profile', 'lastfm', 'last.fm'],
	groups: ['Media'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" /></svg>`
} as CardDefinition & { type: 'lastfmProfile' };
