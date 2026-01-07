import { loadData } from '$lib/website/load';
import { env } from '$env/dynamic/public';

export async function load() {
	const data = await loadData(env.PUBLIC_HANDLE);
	return { ...data, handle: env.PUBLIC_HANDLE };
}
