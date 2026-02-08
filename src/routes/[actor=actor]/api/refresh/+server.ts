import { createCache } from '$lib/cache';
import { loadData } from '$lib/website/load.js';
import { env } from '$env/dynamic/private';
import type { Handle } from '@atcute/lexicons';
import { json } from '@sveltejs/kit';

export async function GET({ params, platform }) {
	const cache = createCache(platform);
	if (!cache) return json('no cache');

	await loadData(params.actor, cache, true, 'self', env);

	return json('ok');
}
