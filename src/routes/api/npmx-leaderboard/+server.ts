import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const LEADERBOARD_API_URL =
	'https://npmx-likes-leaderboard-api-production.up.railway.app/api/leaderboard/likes';

export const GET: RequestHandler = async ({ platform }) => {
	const cacheKey = '#npmx-leaderboard:likes';
	const cachedData = await platform?.env?.USER_DATA_CACHE?.get(cacheKey);

	if (cachedData) {
		const parsedCache = JSON.parse(cachedData);

		const TWELVE_HOURS = 12 * 60 * 60 * 1000;
		const now = Date.now();

		if (now - (parsedCache.updatedAt || 0) < TWELVE_HOURS) {
			return json(parsedCache.data);
		}
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

		await platform?.env?.USER_DATA_CACHE?.put(
			cacheKey,
			JSON.stringify({ data, updatedAt: Date.now() })
		);

		return json(data);
	} catch (error) {
		console.error('Error fetching npmx leaderboard:', error);
		return json({ error: 'Failed to fetch npmx leaderboard' }, { status: 500 });
	}
};
