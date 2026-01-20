import {
	configureOAuth,
	createAuthorizationUrl,
	finalizeAuthorization,
	resolveFromIdentity,
	type Session,
	OAuthUserAgent,
	getSession
} from '@atcute/oauth-browser-client';
import { dev } from '$app/environment';
import { XRPC } from '@atcute/client';
import { metadata } from './const';

export const client = $state({
	agent: null as OAuthUserAgent | null,
	session: null as Session | null,
	rpc: null as XRPC | null,
	profile: null as {
		handle: string;
		did: string;
		createdAt: string;
		description?: string;
		displayName?: string;
		banner?: string;
		avatar?: string;
		followersCount?: number;
		followsCount?: number;
		postsCount?: number;
	} | null,
	isInitializing: true,
	isLoggedIn: false
});

export async function initClient() {
	client.isInitializing = true;

	const clientId = dev
		? `http://localhost` +
			`?redirect_uri=${encodeURIComponent('http://127.0.0.1:5179')}` +
			`&scope=${encodeURIComponent(metadata.scope)}`
		: metadata.client_id;

	configureOAuth({
		metadata: {
			client_id: clientId,
			redirect_uri: `${dev ? 'http://127.0.0.1:5179' : metadata.redirect_uris[0]}`
		}
	});

	const params = new URLSearchParams(location.hash.slice(1));

	const did = localStorage.getItem('last-login') ?? undefined;

	if (params.size > 0) {
		await finalizeLogin(params, did);
	} else if (did) {
		console.log('resuming session');
		await resumeSession(did);
	}

	client.isInitializing = false;
}

export async function login(handle: string) {
	if (handle.startsWith('did:')) {
		if (handle.length > 5) await authorizationFlow(handle);
		else throw new Error('DID must be at least 6 characters');
	} else if (handle.includes('.') && handle.length > 3) {
		const processed = handle.startsWith('@') ? handle.slice(1) : handle;
		if (processed.length > 3) await authorizationFlow(processed);
		else throw new Error('Handle must be at least 4 characters');
	} else if (handle.length > 3) {
		const processed = (handle.startsWith('@') ? handle.slice(1) : handle) + '.bsky.social';
		await authorizationFlow(processed);
	} else {
		throw new Error('Please provide a valid handle, DID, or PDS URL');
	}
}

export async function logout() {
	const currentAgent = client.agent;
	if (currentAgent) {
		const did = currentAgent.session.info.sub;

		localStorage.removeItem('last-login');
		localStorage.removeItem(`profile-${did}`);

		await currentAgent.signOut();
		client.session = null;
		client.agent = null;
		client.profile = null;

		client.isLoggedIn = false;
	} else {
		throw new Error('Not signed in');
	}
}

async function finalizeLogin(params: URLSearchParams, did?: string) {
	try {
		history.replaceState(null, '', location.pathname + location.search);

		const session = await finalizeAuthorization(params);
		client.session = session;

		setAgentAndXRPC(session);
		localStorage.setItem('last-login', session.info.sub);

		await loadProfile(session.info.sub);

		client.isLoggedIn = true;
	} catch (error) {
		console.error('error finalizing login', error);
		if (did) {
			await resumeSession(did);
		}
	}
}

async function resumeSession(did: string) {
	try {
		const session = await getSession(did as `did:${string}:${string}`, { allowStale: true });
		console.log('got session', session);

		if (session.token.expires_at && session.token.expires_at < Date.now()) {
			throw Error('session expired');
		}
		client.session = session;

		setAgentAndXRPC(session);

		await loadProfile(session.info.sub);

		client.isLoggedIn = true;
	} catch (error) {
		console.error('error resuming session', error);
		logout();
	}
}

function setAgentAndXRPC(session: Session) {
	client.agent = new OAuthUserAgent(session);

	client.rpc = new XRPC({ handler: client.agent });
}

async function loadProfile(actor: string) {
	// check if profile is already loaded in local storage
	const profile = localStorage.getItem(`profile-${actor}`);
	if (profile) {
		console.log('loading profile from local storage');
		client.profile = JSON.parse(profile);
		return;
	}

	console.log('loading profile from server');
	const response = await client.rpc?.request({
		type: 'get',
		nsid: 'app.bsky.actor.getProfile',
		params: { actor }
	});

	if (response) {
		client.profile = response.data;
		localStorage.setItem(`profile-${actor}`, JSON.stringify(response.data));
	}
}

async function authorizationFlow(input: string) {
	const { identity, metadata: meta } = await resolveFromIdentity(input);

	const authUrl = await createAuthorizationUrl({
		metadata: meta,
		identity: identity,
		scope: metadata.scope
	});

	await new Promise((resolve) => setTimeout(resolve, 200));

	window.location.assign(authUrl);

	await new Promise((_resolve, reject) => {
		const listener = () => {
			reject(new Error(`user aborted the login request`));
		};

		window.addEventListener('pageshow', listener, { once: true });
	});
}
