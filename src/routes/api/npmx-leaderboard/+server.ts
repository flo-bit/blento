import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCache } from '$lib/cache';

const LEADERBOARD_API_URL =
	'https://npmx-likes-leaderboard-api-production.up.railway.app/api/leaderboard/likes?limit=20';

export const GET: RequestHandler = async ({ platform }) => {
	const cache = createCache(platform);
	const cachedData = await cache?.get('npmx', 'likes');

	if (cachedData) {
		return json(JSON.parse(cachedData));
	}

	try {
		const response = await fetch(LEADERBOARD_API_URL);

		if (!response.ok) {
			return json(
				{ error: 'Failed to fetch npmx leaderboard ' + response.statusText },
				{ status: response.status }
			);
		}

		const data = await response.json();

		await cache?.put('npmx', 'likes', JSON.stringify(data));

		return json(data);
	} catch (error) {
		console.error('Error fetching npmx leaderboard:', error);
		return json({ error: 'Failed to fetch npmx leaderboard' }, { status: 500 });
	}
};
