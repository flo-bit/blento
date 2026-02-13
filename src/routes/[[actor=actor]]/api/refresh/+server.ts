import { createCache } from '$lib/cache';
import { loadData } from '$lib/website/load.js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { ActorIdentifier } from '@atcute/lexicons';
import { error, json } from '@sveltejs/kit';

export async function GET({ params, platform, request }) {
	const cache = createCache(platform);
	if (!cache) return json('no cache');

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
	}

	if (!actor) {
		throw error(404, 'Page not found');
	}

	return json(await loadData(actor, cache, true, 'self', env));
}
