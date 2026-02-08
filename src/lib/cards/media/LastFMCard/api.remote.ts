import { query, getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { createCache } from '$lib/cache';

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

const CACHE_TTL: Record<string, number> = {
	'user.getRecentTracks': 15 * 60,
	'user.getTopTracks': 60 * 60,
	'user.getTopAlbums': 60 * 60,
	'user.getInfo': 12 * 60 * 60
};

export const fetchLastFM = query(
	'unchecked',
	async ({
		method,
		user,
		period = '7day',
		limit = '50'
	}: {
		method: string;
		user: string;
		period?: string;
		limit?: string;
	}) => {
		const apiKey = env?.LASTFM_API_KEY;
		if (!apiKey) return undefined;

		const { platform } = getRequestEvent();
		const cache = createCache(platform);

		const cacheKey = `${method}:${user}:${period}:${limit}`;
		const cached = await cache?.get('lastfm', cacheKey);
		if (cached) return JSON.parse(cached);

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
		if (!response.ok) return undefined;

		const data = await response.json();
		if (data.error) return undefined;

		const ttl = CACHE_TTL[method] || 60 * 60;
		await cache?.put('lastfm', cacheKey, JSON.stringify(data), ttl);
		return data;
	}
);
