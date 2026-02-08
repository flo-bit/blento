import { query, getRequestEvent } from '$app/server';
import { createCache } from '$lib/cache';

const LEADERBOARD_API_URL =
	'https://npmx-likes-leaderboard-api-production.up.railway.app/api/leaderboard/likes?limit=20';

export const fetchNpmxLeaderboard = query(async () => {
	const { platform } = getRequestEvent();
	const cache = createCache(platform);

	const cached = await cache?.get('npmx', 'likes');
	if (cached) return JSON.parse(cached);

	const response = await fetch(LEADERBOARD_API_URL);
	if (!response.ok) return undefined;

	const data = await response.json();
	await cache?.put('npmx', 'likes', JSON.stringify(data));
	return data;
});
