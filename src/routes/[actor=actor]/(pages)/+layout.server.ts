import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { createCache } from '$lib/cache';
import type { Handle } from '@atcute/lexicons';

export async function load({ params, platform }) {
	if (env.PUBLIC_IS_SELFHOSTED) error(404);

	const cache = createCache(platform);

	return await loadData(params.actor, cache, false, params.page);
}
