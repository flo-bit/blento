import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	if (env.PUBLIC_IS_SELFHOSTED) error(404);
	return await loadData(params.handle);
}
