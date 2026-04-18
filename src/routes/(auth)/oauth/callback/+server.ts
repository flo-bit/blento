import { redirect } from '@sveltejs/kit';
import { createOAuthClient } from '$lib/atproto/server/oauth';
import { setSignedCookie } from '$lib/atproto/server/signed-cookie';
import { scopes } from '$lib/atproto/server/scopes';
import { getDetailedProfile } from '$lib/atproto/methods';
import { dev } from '$app/environment';
import type { Did } from '@atcute/lexicons';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform, cookies, request }) => {
	const customDomain = request.headers.get('X-Custom-Domain')?.toLowerCase() || undefined;
	const oauth = createOAuthClient(platform?.env, customDomain);

	let did: Did;
	try {
		const { session } = await oauth.callback(url.searchParams);
		did = session.did;

		const cookieOpts = {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax' as const,
			maxAge: 60 * 60 * 24 * 180 // 180 days
		};

		setSignedCookie(cookies, 'did', did, cookieOpts);
		setSignedCookie(cookies, 'scope', scopes.join(' '), cookieOpts);
	} catch (e) {
		console.error('OAuth callback failed:', e);
		redirect(303, '/?error=auth_failed');
	}

	const profile = await getDetailedProfile({ did }).catch(() => undefined);
	const actor = profile?.handle && profile.handle !== 'handle.invalid' ? profile.handle : did;
	redirect(303, `/${actor}/edit`);
};
