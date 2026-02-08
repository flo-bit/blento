import { getDetailedProfile } from '$lib/atproto';
import { createCache } from '$lib/cache';
import { json } from '@sveltejs/kit';
import type { AppBskyActorDefs } from '@atcute/bluesky';

export async function GET({ platform }) {
	const cache = createCache(platform);
	if (!cache) return json('no cache');

	const existingUsers = await cache.get('meta', 'updatedBlentos');

	const existingUsersArray: AppBskyActorDefs.ProfileViewDetailed[] = existingUsers
		? JSON.parse(existingUsers)
		: [];

	const existingUsersSet = new Set(existingUsersArray.map((v) => v.did));

	const newProfilesPromises: Promise<AppBskyActorDefs.ProfileViewDetailed | undefined>[] = [];
	for (const did of Array.from(existingUsersSet)) {
		const profile = getDetailedProfile({ did });
		newProfilesPromises.push(profile);
		if (newProfilesPromises.length > 20) break;
	}

	const newProfiles = await Promise.all(newProfilesPromises);

	await cache.put('meta', 'updatedBlentos', JSON.stringify(newProfiles));

	return json('ok');
}
