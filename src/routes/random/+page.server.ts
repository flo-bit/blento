import type { UserCache, WebsiteData } from '$lib/types.js';
import { getCache } from '$lib/website/load.js';
import { error } from '@sveltejs/kit';

export async function load({ platform }) {
	const cache = platform?.env?.USER_DATA_CACHE;

	const list = await cache?.list();

	if (!list) {
		throw error(404);
	}

	let foundData: WebsiteData | undefined = undefined;
	let i = 0;

	while (!foundData && i < 20) {
		const rando = Math.floor(Math.random() * list.keys.length);
		console.log(list.keys[rando].name);

		foundData = await getCache(list.keys[rando].name, 'self', cache as unknown as UserCache);

		if (!foundData?.cards.length) foundData = undefined;
		i++;
	}

	if (!foundData) throw error(404);

	return foundData;
}
