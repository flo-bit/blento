import { listenBrainzFetch, usernameSchema } from '../shared.server';
import { query, getRequestEvent } from '$app/server';
import { createCache } from '$lib/cache';
import type { Listen } from '../types';
import { error } from '@sveltejs/kit';

interface ResponseData {
	payload: {
		listens: Listen[];
	};
}

export const recentListens = query(usernameSchema, async (username): Promise<Listen[]> => {
	const { platform } = getRequestEvent();
	const cache = createCache(platform);

	const cacheKey = `recentListens:${username}`;
	const cached = await cache?.get('listenbrainz', cacheKey);
	if (cached) return JSON.parse(cached);

	const data = await listenBrainzFetch<ResponseData>(`/1/user/${username}/listens`, {
		count: 50
	});

	if (data instanceof Error) {
		error(500, 'failed to fetch from ListenBrainz');
	}

	await cache?.put('listenbrainz', cacheKey, JSON.stringify(data.payload.listens), 15 * 60);
	return data.payload.listens;
});
