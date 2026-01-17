import { env } from '$env/dynamic/public';
import type { UserCache, WebsiteData } from '$lib/types.js';
import { loadData } from '$lib/website/load';
import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs.js';

export async function load({ platform }) {
	const cache = platform?.env?.USER_DATA_CACHE;

	const list = await cache?.list();

	const profiles: ProfileViewDetailed[] = [];
	for (const value of list?.keys ?? []) {
		// check if at least one card
		const result = await cache?.get(value.name);
		if (!result) continue;
		const parsed = JSON.parse(result) as WebsiteData;

		if (parsed.version !== 1 || !parsed.cards?.length) continue;

		profiles.push(parsed.profile);
	}

	profiles.sort((a, b) => a.handle.localeCompare(b.handle));

	const handle = env.PUBLIC_HANDLE;

	const data = await loadData(handle, cache as unknown as UserCache);

	data.publication ??= {};
	data.publication.preferences ??= {};
	data.publication.preferences.hideProfile = true;

	return { ...data, profiles };
}
