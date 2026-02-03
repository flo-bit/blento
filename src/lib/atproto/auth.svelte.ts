import {
	configureOAuth,
	createAuthorizationUrl,
	finalizeAuthorization,
	OAuthUserAgent,
	getSession,
	deleteStoredSession
} from '@atcute/oauth-browser-client';
import { AppBskyActorDefs } from '@atcute/bluesky';
import {
	CompositeDidDocumentResolver,
	CompositeHandleResolver,
	DohJsonHandleResolver,
	LocalActorResolver,
	PlcDidDocumentResolver,
	WebDidDocumentResolver,
	WellKnownHandleResolver
} from '@atcute/identity-resolver';
import { Client } from '@atcute/client';

import { dev } from '$app/environment';
import { replaceState } from '$app/navigation';

import { metadata } from './metadata';
import { describeRepo, getDetailedProfile } from './methods';
import { DOH_RESOLVER, REDIRECT_PATH, signUpPDS } from './settings';
import { SvelteURLSearchParams } from 'svelte/reactivity';

import type { ActorIdentifier, Did } from '@atcute/lexicons';

export const user = $state({
	agent: null as OAuthUserAgent | null,
	client: null as Client | null,
	profile: null as AppBskyActorDefs.ProfileViewDetailed | null | undefined,
	isInitializing: true,
	isLoggedIn: false,
	did: undefined as Did | undefined
});

export async function initClient(options?: { customDomain?: string }) {
	user.isInitializing = true;

	let client_id = dev
		? `http://localhost` +
			`?redirect_uri=${encodeURIComponent('http://127.0.0.1:5179' + REDIRECT_PATH)}` +
			`&scope=${encodeURIComponent(metadata.scope)}`
		: metadata.client_id;

	const handleResolver = new CompositeHandleResolver({
		methods: {
			dns: new DohJsonHandleResolver({ dohUrl: DOH_RESOLVER }),
			http: new WellKnownHandleResolver()
		}
	});

	let redirect_uri = dev ? 'http://127.0.0.1:5179' + REDIRECT_PATH : metadata.redirect_uris[0];

	if (options?.customDomain) {
		client_id = client_id.replace('blento.app', options.customDomain);
		redirect_uri = redirect_uri.replace('blento.app', options.customDomain);

		console.log(client_id, redirect_uri);
	} else {
		console.log('no custom domain');
	}

	configureOAuth({
		metadata: {
			client_id,
			redirect_uri
		},
		identityResolver: new LocalActorResolver({
			handleResolver: handleResolver,
			didDocumentResolver: new CompositeDidDocumentResolver({
				methods: {
					plc: new PlcDidDocumentResolver(),
					web: new WebDidDocumentResolver()
				}
			})
		})
	});

	const params = new SvelteURLSearchParams(location.hash.slice(1));

	const did = (localStorage.getItem('current-login') as Did) ?? undefined;

	if (params.size > 0) {
		await finalizeLogin(params, did);
	} else if (did) {
		await resumeSession(did);
	}

	user.isInitializing = false;
}

export async function login(handle: ActorIdentifier) {
	console.log('login in with', handle);
	if (handle.startsWith('did:')) {
		if (handle.length < 6) throw new Error('DID must be at least 6 characters');

		await startAuthorization(handle as ActorIdentifier);
	} else if (handle.includes('.') && handle.length > 3) {
		const processed = handle.startsWith('@') ? handle.slice(1) : handle;
		if (processed.length < 4) throw new Error('Handle must be at least 4 characters');

		await startAuthorization(processed as ActorIdentifier);
	} else if (handle.length > 3) {
		const processed = (handle.startsWith('@') ? handle.slice(1) : handle) + '.bsky.social';
		await startAuthorization(processed as ActorIdentifier);
	} else {
		throw new Error('Please provide a valid handle or DID.');
	}
}

export async function signup() {
	await startAuthorization();
}

async function startAuthorization(identity?: ActorIdentifier) {
	const authUrl = await createAuthorizationUrl({
		target: identity
			? { type: 'account', identifier: identity }
			: { type: 'pds', serviceUrl: signUpPDS },
		// @ts-expect-error - new stuff
		prompt: identity ? undefined : 'create',
		scope: metadata.scope
	});

	// let browser persist local storage
	await new Promise((resolve) => setTimeout(resolve, 200));

	window.location.assign(authUrl);

	await new Promise((_resolve, reject) => {
		const listener = () => {
			reject(new Error(`user aborted the login request`));
		};

		window.addEventListener('pageshow', listener, { once: true });
	});
}

export async function logout() {
	const currentAgent = user.agent;
	if (currentAgent) {
		const did = currentAgent.session.info.sub;

		localStorage.removeItem('current-login');
		localStorage.removeItem(`profile-${did}`);

		try {
			await currentAgent.signOut();
		} catch {
			deleteStoredSession(did);
		}

		user.agent = null;
		user.profile = null;
		user.isLoggedIn = false;
	} else {
		console.error('trying to logout, but user not signed in');
		return false;
	}
}

async function finalizeLogin(params: SvelteURLSearchParams, did?: Did) {
	try {
		const { session } = await finalizeAuthorization(params);
		replaceState(location.pathname + location.search, {});

		user.agent = new OAuthUserAgent(session);
		user.did = session.info.sub;
		user.client = new Client({ handler: user.agent });

		localStorage.setItem('current-login', session.info.sub);

		await loadProfile(session.info.sub);

		user.isLoggedIn = true;

		try {
			if (!user.profile) return;
			const recentLogins = JSON.parse(localStorage.getItem('recent-logins') || '{}');

			recentLogins[session.info.sub] = user.profile;

			localStorage.setItem('recent-logins', JSON.stringify(recentLogins));
		} catch {
			console.log('failed to save to recent logins');
		}
	} catch (error) {
		console.error('error finalizing login', error);
		if (did) {
			await resumeSession(did);
		}
	}
}

async function resumeSession(did: Did) {
	try {
		const session = await getSession(did, { allowStale: true });

		if (session.token.expires_at && session.token.expires_at < Date.now()) {
			throw Error('session expired');
		}

		if (session.token.scope !== metadata.scope) {
			throw Error('scope changed, signing out!');
		}

		user.agent = new OAuthUserAgent(session);
		user.did = session.info.sub;
		user.client = new Client({ handler: user.agent });

		await loadProfile(session.info.sub);

		user.isLoggedIn = true;
	} catch (error) {
		console.error('error resuming session', error);
		deleteStoredSession(did);
	}
}

async function loadProfile(actor: Did) {
	// check if profile is already loaded in local storage
	const profile = localStorage.getItem(`profile-${actor}`);
	if (profile) {
		try {
			user.profile = JSON.parse(profile);
			return;
		} catch {
			console.error('error loading profile from local storage');
		}
	}

	const response = await getDetailedProfile();

	if (!response || response.handle === 'handle.invalid') {
		console.log('invalid handle or no profile from bsky, fetching from repo description');
		const repo = await describeRepo({ did: actor });
		user.profile = {
			did: actor,
			handle: repo?.handle || 'handle.invalid'
		};
		localStorage.setItem(`profile-${actor}`, JSON.stringify(user.profile));
	} else {
		user.profile = response;
		localStorage.setItem(`profile-${actor}`, JSON.stringify(response));
	}
}
