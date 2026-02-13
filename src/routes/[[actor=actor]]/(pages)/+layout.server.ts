import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { createCache } from '$lib/cache';
import type { ActorIdentifier } from '@atcute/lexicons';
import { env as publicEnv } from '$env/dynamic/public';

export async function load({ params, platform, request }) {
	if (env.PUBLIC_IS_SELFHOSTED) error(404);

	const cache = createCache(platform);

	const customDomain = request.headers.get('X-Custom-Domain')?.toLowerCase();

	let actor: ActorIdentifier | undefined = params.actor;

	if (!actor) {
		const kv = platform?.env?.CUSTOM_DOMAINS;

		if (kv && customDomain) {
			try {
				const did = await kv.get(customDomain);

				if (did) actor = did as ActorIdentifier;
			} catch (error) {
				console.error('failed to get custom domain kv', error);
			}
		} else {
			actor = publicEnv.PUBLIC_HANDLE as ActorIdentifier;
		}
	} else if (customDomain && params.actor) {
		actor = undefined;
	}

	if (!actor) {
		throw error(404, 'Page not found');
	}

	return await loadData(actor, cache, false, params.page, env);
}
