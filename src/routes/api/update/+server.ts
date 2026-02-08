import { createCache } from '$lib/cache';
import { getCache, loadData } from '$lib/website/load';
import { json } from '@sveltejs/kit';
import type { AppBskyActorDefs } from '@atcute/bluesky';

export async function GET({ platform }) {
	const cache = createCache(platform);
	if (!cache) return json('no cache');

	const existingUsers = await cache.get('meta', 'updatedBlentos');

	const existingUsersArray: AppBskyActorDefs.ProfileViewDetailed[] = existingUsers
		? JSON.parse(existingUsers)
		: [];

	const existingUsersHandle = existingUsersArray.map((v) => v.handle);

	for (const handle of existingUsersHandle) {
		if (!handle) continue;

		try {
			const cached = await getCache(handle, 'self', cache);
			if (!cached) await loadData(handle, cache, true);
		} catch (error) {
			console.error(error);
			return json('error');
		}
	}

	return json('ok');
}
