import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

export const SITE = env.PUBLIC_DOMAIN;

type Permissions = {
	collections: readonly string[];
	rpc: Record<string, string | string[]>;
	blobs: readonly string[];
};

export const permissions = {
	// collections you can create/delete/update

	// example: only allow create and delete
	// collections: ['xyz.statusphere.status?action=create&action=update'],
	collections: [
		'app.blento.card',
		'app.blento.page',
		'app.blento.settings',
		'app.blento.comment',
		'app.blento.guestbook.entry',
		'app.bsky.feed.post?action=create',
		'site.standard.publication',
		'site.standard.document',
		'xyz.statusphere.status'
	],

	// what types of authenticated proxied requests you can make to services

	// example: allow authenticated proxying to bsky appview to get a users liked posts
	//rpc: {'did:web:api.bsky.app#bsky_appview': ['app.bsky.feed.getActorLikes']}
	rpc: {},

	// what types of blobs you can upload to a users PDS

	// example: allowing video and html uploads
	// blobs: ['video/*', 'text/html']
	// example: allowing all blob types
	// blobs: ['*/*']
	blobs: ['*/*']
} as const satisfies Permissions;

// Extract base collection name (before any query params)
type ExtractCollectionBase<T extends string> = T extends `${infer Base}?${string}` ? Base : T;

export type AllowedCollection = ExtractCollectionBase<(typeof permissions.collections)[number]>;

// which PDS to use for signup
// ATTENTION: pds.rip is only for development, all accounts get deleted automatically after a week
const devPDS = 'https://pds.rip/';
const prodPDS = 'https://selfhosted.social/';
export const signUpPDS = dev ? devPDS : prodPDS;

// where to redirect after oauth login/signup, e.g. /oauth/callback
export const REDIRECT_PATH = '/oauth/callback';

export const DOH_RESOLVER = 'https://mozilla.cloudflare-dns.com/dns-query';
