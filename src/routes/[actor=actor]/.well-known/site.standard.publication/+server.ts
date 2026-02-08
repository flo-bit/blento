import { loadData } from '$lib/website/load';
import { createCache } from '$lib/cache';

import { error } from '@sveltejs/kit';
import { text } from '@sveltejs/kit';

export async function GET({ params, platform }) {
	const cache = createCache(platform);

	const data = await loadData(params.actor, cache, false, params.page);

	if (!data.publication) throw error(300);

	return text(data.did + '/site.standard.publication/blento.self');
}
