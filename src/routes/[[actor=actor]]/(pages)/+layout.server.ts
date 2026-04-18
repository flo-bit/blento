import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { createCache } from '$lib/cache';
import { getActor } from '$lib/actor.js';
import { logPageview } from '$lib/analytics';

export async function load({ params, platform, request, locals, route, setHeaders }) {
	if (env.PUBLIC_IS_SELFHOSTED) error(404);

	const cache = createCache(platform);

	const actor = await getActor({ request, paramActor: params.actor, platform });

	if (!actor) {
		throw error(404, 'Page not found');
	}

	const data = await loadData(actor, cache, params.page, env, platform);

	const isInteractiveRoute = route.id?.endsWith('/edit') || route.id?.endsWith('/copy') || false;
	const isAnonymous = !locals.did;

	if (isAnonymous && !isInteractiveRoute) {
		setHeaders({
			'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600'
		});
	} else {
		setHeaders({ 'Cache-Control': 'private, no-store' });
	}

	if (!isInteractiveRoute) {
		logPageview(platform, {
			did: data.did,
			handle: data.handle,
			page: params.page ?? 'self',
			request
		});
	}

	return data;
}
