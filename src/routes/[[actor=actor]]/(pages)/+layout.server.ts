import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { createCache } from '$lib/cache';
import { getActor } from '$lib/actor.js';

export async function load({ params, platform, request }) {
	if (env.PUBLIC_IS_SELFHOSTED) error(404);

	const cache = createCache(platform);

	const actor = await getActor({ request, paramActor: params.actor, platform });

	if (!actor) {
		throw error(404, 'Page not found');
	}

	return await loadData(actor, cache, false, params.page, env);
}
