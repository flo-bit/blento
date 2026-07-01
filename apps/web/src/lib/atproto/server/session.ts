import type { Cookies } from '@sveltejs/kit';
import { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import {
	type OAuthSession,
	TokenInvalidError,
	TokenRefreshError,
	TokenRevokedError,
	AuthMethodUnsatisfiableError
} from '@atcute/oauth-node-client';
import { createOAuthClient } from './oauth';
import { getSignedCookie } from './signed-cookie';
import { scopes } from './scopes';

export type SessionLocals = {
	session: OAuthSession | null;
	client: Client | null;
	did: Did | null;
};

/**
 * Restores an OAuth session from the signed `did` cookie.
 * Deletes the cookie only if the session is genuinely unrecoverable.
 */
export async function restoreSession(
	cookies: Cookies,
	env?: App.Platform['env'],
	domain?: string
): Promise<SessionLocals> {
	const did = getSignedCookie(cookies, 'did') as Did | null;

	if (!did) {
		return { session: null, client: null, did: null };
	}

	// If permissions changed since login, invalidate the session
	const savedScope = getSignedCookie(cookies, 'scope');
	if (savedScope !== null && savedScope !== scopes.join(' ')) {
		cookies.delete('did', { path: '/' });
		cookies.delete('scope', { path: '/' });
		return { session: null, client: null, did: null };
	}

	try {
		const oauth = createOAuthClient(env, domain);
		const session = await oauth.restore(did);

		return {
			session,
			client: new Client({ handler: session }),
			did
		};
	} catch (e) {
		console.error('Failed to restore session:', e);

		const isSessionGone =
			e instanceof TokenInvalidError ||
			e instanceof TokenRevokedError ||
			e instanceof TokenRefreshError ||
			e instanceof AuthMethodUnsatisfiableError;

		if (isSessionGone) {
			cookies.delete('did', { path: '/' });
			cookies.delete('scope', { path: '/' });
		}

		return { session: null, client: null, did: null };
	}
}
