import { createCache } from '$lib/cache';
import { loadData } from '$lib/website/load.js';
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { getActor } from '$lib/actor';

export async function GET({ params, platform, request }) {
	const cache = createCache(platform);
	if (!cache) return json('no cache');

	const actor = await getActor({ request, paramActor: params.actor, platform, blockBoth: false });

	if (!actor) {
		throw error(404, 'Page not found');
	}

	return json(await loadData(actor, cache, true, 'self', env));
}
