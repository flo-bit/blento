import { loadData } from '$lib/website/load';
import { createCache } from '$lib/cache';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { text } from '@sveltejs/kit';
import { getActor } from '$lib/actor.js';

export async function GET({ params, platform, request }) {
	const cache = createCache(platform);

	const actor = await getActor({ request, paramActor: params.actor, platform });

	if (!actor) {
		throw error(404, 'Page not found');
	}

	const data = await loadData(actor, cache, false, params.page, env);

	if (!data.publication) throw error(300);

	return text(data.did + '/site.standard.publication/blento.self');
}
