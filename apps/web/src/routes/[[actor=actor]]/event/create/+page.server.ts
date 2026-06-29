import { env as publicEnv } from '$env/dynamic/public';
import { redirect } from '@sveltejs/kit';

export async function load({ locals, request }) {
	if (!locals.did) {
		const customDomain = request.headers.get('X-Custom-Domain');
		const canonical = publicEnv.PUBLIC_DOMAIN || 'https://blento.app';
		redirect(303, customDomain ? `${canonical}/login` : '/login');
	}
	return { authDid: locals.did };
}
