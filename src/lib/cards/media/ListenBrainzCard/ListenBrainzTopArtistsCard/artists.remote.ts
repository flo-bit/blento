import { listenBrainzFetch, usernameSchema } from '../shared.server';
import { query, getRequestEvent } from '$app/server';
import { createCache } from '$lib/cache';
import type { Artist } from '../types';
import { error } from '@sveltejs/kit';

interface ResponseData {
	payload: {
		artists: Artist[];
	};
}

export const topArtists = query(usernameSchema, async (username): Promise<Artist[] | null> => {
	if (!username) return null;

	const { platform } = getRequestEvent();
	const cache = createCache(platform);

	const cacheKey = `topArtists:${username}`;
	const cached = await cache?.get('listenbrainz', cacheKey);
	if (cached) return JSON.parse(cached);

	const data = await listenBrainzFetch<ResponseData>(`/1/stats/user/${username}/artists`, {
		count: 50,
		range: 'week'
	});

	if (data instanceof Error) {
		error(500, 'failed to fetch from ListenBrainz');
	}

	await cache?.put('listenbrainz', cacheKey, JSON.stringify(data.payload.artists), 60 * 60);
	return data.payload.artists;
});
