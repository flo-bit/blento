import { loadData } from '$lib/website/load';
import { createCache } from '$lib/cache';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { ActorIdentifier } from '@atcute/lexicons';

import { error } from '@sveltejs/kit';
import { text } from '@sveltejs/kit';

export async function GET({ params, platform, request }) {
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

	const data = await loadData(actor, cache, false, params.page, env);

	if (!data.publication) throw error(300);

	return text(data.did + '/site.standard.publication/blento.self');
}
