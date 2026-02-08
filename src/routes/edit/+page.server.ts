import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/public';
import { createCache } from '$lib/cache';
import type { ActorIdentifier } from '@atcute/lexicons';

export async function load({ platform, request }) {
	const handle = env.PUBLIC_HANDLE;

	const kv = platform?.env?.CUSTOM_DOMAINS;

	const cache = createCache(platform);
	const customDomain = request.headers.get('X-Custom-Domain')?.toLowerCase();

	if (kv && customDomain) {
		try {
			const did = await kv.get(customDomain);

			if (did) return await loadData(did as ActorIdentifier, cache);
		} catch (error) {
			console.error('failed to get custom domain kv', error);
		}
	}

	return await loadData(handle as ActorIdentifier, cache);
}
