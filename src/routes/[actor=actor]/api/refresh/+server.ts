import { createCache } from '$lib/cache';
import { loadData } from '$lib/website/load.js';
import type { Handle } from '@atcute/lexicons';
import { json } from '@sveltejs/kit';

export async function GET({ params, platform }) {
	const cache = createCache(platform);
	if (!cache) return json('no cache');

	await loadData(params.actor, cache, true);

	return json('ok');
}
