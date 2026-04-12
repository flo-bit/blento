import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { command, getRequestEvent } from '$app/server';
import { createOAuthClient } from './oauth';
import { getSignedCookie } from './signed-cookie';
import { signUpPDS } from '../settings';
import { scopes } from './scopes';
import type { ActorIdentifier, Did } from '@atcute/lexicons';

function getDomain(): string | undefined {
	const { request } = getRequestEvent();
	return request.headers.get('X-Custom-Domain')?.toLowerCase() || undefined;
}

export const oauthLogin = command(
	v.object({
		handle: v.optional(v.pipe(v.string(), v.minLength(3))),
		signup: v.optional(v.boolean()),
		returnTo: v.optional(v.string())
	}),
	async (input) => {
		const { platform, cookies } = getRequestEvent();

		try {
			const oauth = createOAuthClient(platform?.env, getDomain());

			const target = input.signup
				? ({ type: 'pds', serviceUrl: signUpPDS } as const)
				: ({ type: 'account', identifier: input.handle as ActorIdentifier } as const);

			const { url } = await oauth.authorize({
				target,
				scope: scopes.join(' '),
				prompt: input.signup ? 'create' : undefined
			});

			// Store return path in a cookie so the callback can redirect back
			if (input.returnTo) {
				cookies.set('oauth_return_to', encodeURIComponent(input.returnTo), {
					path: '/',
					httpOnly: true,
					maxAge: 600 // 10 minutes
				});
			}

			return { url: url.toString() };
		} catch (e) {
			if (e && typeof e === 'object' && 'status' in e) throw e;
			const message = e instanceof Error ? e.message : 'Login failed';
			error(400, message);
		}
	}
);

export const oauthLogout = command(async () => {
	const { cookies, platform } = getRequestEvent();
	const did = getSignedCookie(cookies, 'did') as Did | null;

	if (did) {
		try {
			const oauth = createOAuthClient(platform?.env, getDomain());
			await oauth.revoke(did);
		} catch (e) {
			console.error('Error revoking session:', e);
		}
	}

	cookies.delete('did', { path: '/' });
	cookies.delete('scope', { path: '/' });

	return { ok: true };
});
