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

export const nowPlaying = query(usernameSchema, async (username): Promise<Listen | null> => {
	const { platform } = getRequestEvent();
	const cache = createCache(platform);

	const cacheKey = `nowPlaying:${username}`;
	const cached = await cache?.get('listenbrainz', cacheKey);
	if (cached) return JSON.parse(cached);

	const data = await listenBrainzFetch<ResponseData>(`/1/user/${username}/playing-now`);

	if (data instanceof Error) {
		error(500, 'failed to fetch from ListenBrainz');
	}

	if (!data.payload.listens.length) {
		return null;
	}

	await cache?.put('listenbrainz', cacheKey, JSON.stringify(data.payload.listens[0]), 60);
	return data.payload.listens[0];
});
