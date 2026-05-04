import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { error, redirect } from '@sveltejs/kit';
import { getDetailedProfile } from '$lib/atproto/methods';

export async function load({ locals, request }) {
	if (env.PUBLIC_IS_SELFHOSTED) error(404);

	if (locals.did) {
		const profile = await getDetailedProfile({ did: locals.did }).catch(() => undefined);
		const actor =
			profile?.handle && profile.handle !== 'handle.invalid' ? profile.handle : locals.did;
		const customDomain = request.headers.get('X-Custom-Domain');
		const canonical = publicEnv.PUBLIC_DOMAIN || 'https://blento.app';
		redirect(303, customDomain ? `${canonical}/${actor}/edit` : `/${actor}/edit`);
	}
}
