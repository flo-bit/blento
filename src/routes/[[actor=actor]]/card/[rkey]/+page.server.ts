import { createCache } from '$lib/cache';
import { getActor } from '$lib/actor';
import { loadCardData } from '$lib/website/load';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function load({ params, platform, request }) {
	const cache = createCache(platform);
	const actor = await getActor({ request, paramActor: params.actor, platform });

	if (!actor) {
		throw error(404, 'Page not found');
	}

	return await loadCardData(actor, params.rkey, cache, env);
}
