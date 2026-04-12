import { type AppBskyActorDefs } from '@atcute/bluesky';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { page } from '$app/state';

let cachedProfile = $state<AppBskyActorDefs.ProfileViewDetailed | null>(null);
let cachedDid = $state<Did | null>(null);

// Load profile client-side when authDid changes
$effect.root(() => {
	$effect(() => {
		const did = page.data?.authDid as Did | undefined;

		if (!did) {
			cachedProfile = null;
			cachedDid = null;
			return;
		}

		if (did === cachedDid && cachedProfile) return;

		cachedDid = did;

		// If the current page already has this user's profile (e.g. viewing own page), use it
		if (page.data?.profile?.did === did) {
			cachedProfile = page.data.profile;
			return;
		}

		// Otherwise fetch it client-side
		import('@atcute/client').then(({ Client, simpleFetchHandler }) => {
			const client = new Client({
				handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' })
			});
			client
				.get('app.bsky.actor.getProfile', { params: { actor: did } })
				.then((res) => {
					if (res.ok && cachedDid === did) {
						cachedProfile = res.data;
					}
				})
				.catch(() => {});
		});
	});
});

export const user: {
	profile: AppBskyActorDefs.ProfileViewDetailed | null | undefined;
	isLoggedIn: boolean;
	did: Did | undefined;
} = {
	get profile() {
		return cachedProfile;
	},
	get isLoggedIn() {
		return !!page.data?.authDid;
	},
	get did() {
		return page.data?.authDid ?? undefined;
	}
};

export async function login(handle: ActorIdentifier) {
	const { oauthLogin } = await import('./server/oauth.remote');

	const returnTo = location.pathname + location.search;

	if (handle.startsWith('did:')) {
		if (handle.length < 6) throw new Error('DID must be at least 6 characters');
	} else if (handle.includes('.') && handle.length > 3) {
		handle = (handle.startsWith('@') ? handle.slice(1) : handle) as ActorIdentifier;
	} else if (handle.length > 3) {
		handle = ((handle.startsWith('@') ? handle.slice(1) : handle) +
			'.bsky.social') as ActorIdentifier;
	} else {
		throw new Error('Please provide a valid handle or DID.');
	}

	const { url } = await oauthLogin({ handle, returnTo });
	window.location.assign(url);
}

export async function signup() {
	const { oauthLogin } = await import('./server/oauth.remote');

	const returnTo = location.pathname + location.search;
	const { url } = await oauthLogin({ signup: true, returnTo });
	window.location.assign(url);
}

export async function logout() {
	const { oauthLogout } = await import('./server/oauth.remote');
	await oauthLogout();
	window.location.href = '/';
}
