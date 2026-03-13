import { listenBrainzFetch, usernameSchema } from '../shared.server';
import { query, getRequestEvent } from '$app/server';
import type { Recording } from '../types';
import { createCache } from '$lib/cache';
import { error } from '@sveltejs/kit';

interface ResponseData {
	payload: {
		recordings: Recording[];
	};
}

export const fetchListenBrainzTopSongs = query(
	usernameSchema,
	async (username): Promise<Recording[] | null> => {
		if (!username) return null;

		const { platform } = getRequestEvent();
		const cache = createCache(platform);

		const cacheKey = `topSongs:${username}`;
		const cached = await cache?.get('listenbrainz', cacheKey);
		if (cached) return JSON.parse(cached);

		const data = await listenBrainzFetch<ResponseData>(`/1/stats/user/${username}/recordings`, {
			range: 'week',
			count: 10,
			offset: 0
		});

		if (data instanceof Error) {
			error(500, 'failed to fetch from ListenBrainz');
		}

		await cache?.put('listenbrainz', cacheKey, JSON.stringify(data.payload.recordings), 60 * 60);
		return data.payload.recordings;
	}
);
