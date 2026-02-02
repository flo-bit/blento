import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/public';
import type { UserCache } from '$lib/types';
import type { ActorIdentifier } from '@atcute/lexicons';

export async function load({ platform, request }) {
	const handle = env.PUBLIC_HANDLE;

	const kv = platform?.env?.CUSTOM_DOMAINS;

	const cache = platform?.env?.USER_DATA_CACHE as unknown;
	const customDomain = request.headers.get('X-Custom-Domain')?.toLocaleLowerCase();

	if (kv && customDomain) {
		try {
			const did = await kv.get(customDomain);

			if (did) return await loadData(did as ActorIdentifier, cache as UserCache);
		} catch (error) {
			console.error('failed to get custom domain kv', error);
		}
	}

	return await loadData(handle as ActorIdentifier, cache as UserCache);
}
