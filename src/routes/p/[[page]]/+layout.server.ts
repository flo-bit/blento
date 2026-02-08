import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { createCache } from '$lib/cache';
import type { Did, Handle } from '@atcute/lexicons';

export async function load({ params, platform, request }) {
	const cache = createCache(platform);

	const handle = env.PUBLIC_HANDLE;

	const kv = platform?.env?.CUSTOM_DOMAINS;

	const customDomain = request.headers.get('X-Custom-Domain')?.toLocaleLowerCase();

	if (kv && customDomain) {
		try {
			const did = await kv.get(customDomain);
			return await loadData(did as Did, cache, false, params.page, privateEnv);
		} catch {
			console.error('failed');
		}
	}

	return await loadData(handle as Handle, cache, false, params.page, privateEnv);
}
