import { listenBrainzFetch, usernameSchema } from '../shared.server';
import { query, getRequestEvent } from '$app/server';
import type { ReleaseGroup } from '../types';
import { createCache } from '$lib/cache';
import { error } from '@sveltejs/kit';

interface ResponseData {
	payload: {
		release_groups: ReleaseGroup[];
	};
}

export const topAlbums = query(usernameSchema, async (username): Promise<ReleaseGroup[]> => {
	const { platform } = getRequestEvent();
	const cache = createCache(platform);

	const cacheKey = `topAlbums:${username}`;
	const cached = await cache?.get('listenbrainz', cacheKey);
	if (cached) return JSON.parse(cached);

	const data = await listenBrainzFetch<ResponseData>(`/1/stats/user/${username}/release-groups`, {
		count: 50,
		range: 'week'
	});

	if (data instanceof Error) {
		error(500, 'failed to fetch from ListenBrainz');
	}

	await cache?.put('listenbrainz', cacheKey, JSON.stringify(data.payload.release_groups), 60 * 60);

	return data.payload.release_groups;
});
