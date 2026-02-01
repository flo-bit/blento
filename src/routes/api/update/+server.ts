import type { UserCache } from '$lib/types';
import { getCache, loadData } from '$lib/website/load';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
	if (!platform?.env?.USER_DATA_CACHE) return json('no cache');
	const existingUsers = await platform?.env?.USER_DATA_CACHE?.get('updatedBlentos');

	const existingUsersArray: AppBskyActorDefs.ProfileViewDetailed[] = existingUsers
		? JSON.parse(existingUsers)
		: [];

	const existingUsersHandle = existingUsersArray.map((v) => v.handle);

	const cache = platform?.env?.USER_DATA_CACHE as unknown;

	for (const handle of existingUsersHandle) {
		if (!handle) continue;

		try {
			const cached = await getCache(handle, 'self', cache as UserCache);
			if (!cached) await loadData(handle, cache as UserCache, true);
		} catch (error) {
			console.error(error);
			return json('error');
		}
	}

	return json('ok');
}
