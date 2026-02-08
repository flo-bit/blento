import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { createCache } from '$lib/cache';

export async function load({ params, platform, request }) {
	if (env.PUBLIC_IS_SELFHOSTED) error(404);

	const cache = createCache(platform);

	const customDomain = request.headers.get('X-Custom-Domain');

	if (customDomain) {
		throw error(404, 'Page not found!');
	}

	return await loadData(params.actor, cache, false, params.page, env);
}
