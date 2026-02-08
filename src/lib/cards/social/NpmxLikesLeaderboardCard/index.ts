import type { CardDefinition } from '../../types';
import NpmxLikesLeaderboardCard from './NpmxLikesLeaderboardCard.svelte';

export const NpmxLikesLeaderboardCardDefinition = {
	type: 'npmxLikesLeaderboard',
	contentComponent: NpmxLikesLeaderboardCard,
	createNew: (card) => {
		card.w = 4;
		card.mobileW = 8;
		card.h = 4;
		card.mobileH = 6;
	},
	loadData: async () => {
		const res = await fetch('https://blento.app/api/npmx-leaderboard');
		const data = await res.json();
		return data;
	},
	loadDataServer: async (_items, { cache }) => {
		try {
			const cached = await cache?.get('npmx', 'likes');
			if (cached) return JSON.parse(cached);
			const response = await fetch(
				'https://npmx-likes-leaderboard-api-production.up.railway.app/api/leaderboard/likes?limit=20'
			);
			if (!response.ok) return undefined;
			const data = await response.json();
			await cache?.put('npmx', 'likes', JSON.stringify(data));
			return data;
		} catch (error) {
			console.error('Error fetching npmx leaderboard:', error);
			return undefined;
		}
	},
	minW: 3,
	canHaveLabel: true,

	keywords: ['npm', 'package', 'npmx', 'likes', 'leaderboard', 'ranking'],
	name: 'npmx Likes Leaderboard',

	//groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-4.5A3.375 3.375 0 0 0 13.125 10.875h-2.25A3.375 3.375 0 0 0 7.5 14.25v4.5m6-6V6.375a3.375 3.375 0 0 0-3-3.353A3.375 3.375 0 0 0 7.5 6.375v1.5" /></svg>`
} as CardDefinition & { type: 'npmxLikesLeaderboard' };
