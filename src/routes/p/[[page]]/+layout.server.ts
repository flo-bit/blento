import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/public';
import type { UserCache } from '$lib/types';
import type { Did, Handle } from '@atcute/lexicons';

export async function load({ params, platform, request }) {
	const cache = platform?.env?.USER_DATA_CACHE as unknown;

	const handle = env.PUBLIC_HANDLE;

	const kv = platform?.env?.CUSTOM_DOMAINS;

	const customDomain = request.headers.get('X-Custom-Domain')?.toLocaleLowerCase();

	if (kv && customDomain) {
		try {
			const did = await kv.get(customDomain);
			return await loadData(did as Did, cache as UserCache, false, params.page);
		} catch {
			console.error('failed');
		}
	}

	return await loadData(handle as Handle, cache as UserCache, false, params.page);
}
