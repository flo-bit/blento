import { redirect } from '@sveltejs/kit';
import { createOAuthClient } from '$lib/atproto/server/oauth';
import { setSignedCookie } from '$lib/atproto/server/signed-cookie';
import { scopes } from '$lib/atproto/server/scopes';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform, cookies, request }) => {
	const customDomain = request.headers.get('X-Custom-Domain')?.toLowerCase() || undefined;
	const oauth = createOAuthClient(platform?.env, customDomain);

	try {
		const { session } = await oauth.callback(url.searchParams);

		const cookieOpts = {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax' as const,
			maxAge: 60 * 60 * 24 * 180 // 180 days
		};

		setSignedCookie(cookies, 'did', session.did, cookieOpts);
		setSignedCookie(cookies, 'scope', scopes.join(' '), cookieOpts);
	} catch (e) {
		console.error('OAuth callback failed:', e);
		redirect(303, '/?error=auth_failed');
	}

	const returnTo = cookies.get('oauth_return_to');
	if (returnTo) {
		cookies.delete('oauth_return_to', { path: '/' });
		const decoded = decodeURIComponent(returnTo);
		if (decoded.startsWith('/') && !decoded.startsWith('//')) {
			redirect(303, decoded);
		}
	}

	redirect(303, '/');
};
