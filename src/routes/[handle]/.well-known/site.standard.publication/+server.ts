import { loadData } from '$lib/website/load';
import { error } from '@sveltejs/kit';
import type { UserCache } from '$lib/types';
import { text } from '@sveltejs/kit';

export async function GET({ params, platform }) {
	const cache = platform?.env?.USER_DATA_CACHE as unknown;

	const data = await loadData(params.handle, cache as UserCache, false, params.page);

	if (!data.publication) throw error(300);

	return text(data.did + '/site.standard.publication/blento.self');
}
