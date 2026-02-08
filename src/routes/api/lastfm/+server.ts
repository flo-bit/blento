import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createCache } from '$lib/cache';

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

const ALLOWED_METHODS = [
	'user.getRecentTracks',
	'user.getTopTracks',
	'user.getTopAlbums',
	'user.getInfo'
];

const CACHE_TTL: Record<string, number> = {
	'user.getRecentTracks': 15 * 60,
	'user.getTopTracks': 60 * 60,
	'user.getTopAlbums': 60 * 60,
	'user.getInfo': 12 * 60 * 60
};

export const GET: RequestHandler = async ({ url, platform }) => {
	const method = url.searchParams.get('method');
	const user = url.searchParams.get('user');
	const period = url.searchParams.get('period') || '7day';
	const limit = url.searchParams.get('limit') || '50';

	if (!method || !user) {
		return json({ error: 'Missing method or user parameter' }, { status: 400 });
	}

	if (!ALLOWED_METHODS.includes(method)) {
		return json({ error: 'Method not allowed' }, { status: 400 });
	}

	const cache = createCache(platform);
	const cacheKey = `${method}:${user}:${period}:${limit}`;
	const cachedData = await cache?.get('lastfm', cacheKey);

	if (cachedData) {
		return json(JSON.parse(cachedData));
	}

	const apiKey = env?.LASTFM_API_KEY;
	if (!apiKey) {
		return json({ error: 'Last.fm API key not configured' }, { status: 500 });
	}

	try {
		const params = new URLSearchParams({
			method,
			user,
			api_key: apiKey,
			format: 'json',
			limit
		});

		if (method === 'user.getTopTracks' || method === 'user.getTopAlbums') {
			params.set('period', period);
		}

		const response = await fetch(`${LASTFM_API_URL}?${params}`);

		if (!response.ok) {
			return json(
				{ error: 'Failed to fetch Last.fm data: ' + response.statusText },
				{ status: response.status }
			);
		}

		const data = await response.json();

		if (data.error) {
			return json({ error: data.message || 'Last.fm API error' }, { status: 400 });
		}

		const ttl = CACHE_TTL[method] || 60 * 60;
		await cache?.put('lastfm', cacheKey, JSON.stringify(data), ttl);

		return json(data);
	} catch (error) {
		console.error('Error fetching Last.fm data:', error);
		return json({ error: 'Failed to fetch Last.fm data' }, { status: 500 });
	}
};
