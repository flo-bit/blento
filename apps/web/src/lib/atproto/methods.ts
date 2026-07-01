import {
	parseResourceUri,
	type ActorIdentifier,
	type Did,
	type Handle,
	type ResourceUri
} from '@atcute/lexicons';
import { user } from './auth.svelte';
import type { AllowedCollection } from './settings';
import {
	CompositeDidDocumentResolver,
	CompositeHandleResolver,
	DohJsonHandleResolver,
	PlcDidDocumentResolver,
	WebDidDocumentResolver,
	WellKnownHandleResolver
} from '@atcute/identity-resolver';
import { Client, simpleFetchHandler } from '@atcute/client';
import { type AppBskyActorDefs } from '@atcute/bluesky';

export type Collection = `${string}.${string}.${string}`;
import * as TID from '@atcute/tid';

/**
 * Parses an AT Protocol URI into its components.
 * @param uri - The AT URI to parse (e.g., "at://did:plc:xyz/app.bsky.feed.post/abc123")
 * @returns An object containing the repo, collection, and rkey or undefined if not an AT uri
 */
export function parseUri(uri: string) {
	const parts = parseResourceUri(uri);
	if (!parts.ok) return;
	return parts.value;
}

/**
 * Resolves a handle to a DID using DNS and HTTP methods.
 * @param handle - The handle to resolve (e.g., "alice.bsky.social")
 * @returns The DID associated with the handle
 */
export async function resolveHandle({ handle }: { handle: Handle }) {
	const handleResolver = new CompositeHandleResolver({
		methods: {
			dns: new DohJsonHandleResolver({ dohUrl: 'https://mozilla.cloudflare-dns.com/dns-query' }),
			http: new WellKnownHandleResolver()
		}
	});

	const data = await handleResolver.resolve(handle);
	return data;
}

const didResolver = new CompositeDidDocumentResolver({
	methods: {
		plc: new PlcDidDocumentResolver(),
		web: new WebDidDocumentResolver()
	}
});

/**
 * Gets the PDS (Personal Data Server) URL for a given DID.
 */
export async function getPDS(did: Did) {
	const doc = await didResolver.resolve(did as Did<'plc'> | Did<'web'>);
	if (!doc.service) throw new Error('No PDS found');
	for (const service of doc.service) {
		if (service.id === '#atproto_pds') {
			return service.serviceEndpoint.toString();
		}
	}
}

/**
 * Fetches a detailed Bluesky profile for a user.
 */
export async function getDetailedProfile(data?: { did?: Did; client?: Client }) {
	data ??= {};
	data.did ??= user.did;

	if (!data.did) throw new Error('Error getting detailed profile: no did');

	data.client ??= new Client({
		handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' })
	});

	const response = await data.client.get('app.bsky.actor.getProfile', {
		params: { actor: data.did }
	});

	if (!response.ok || response.data.handle === 'handle.invalid') {
		const repo = await describeRepo({ did: data.did });
		return { handle: repo?.handle ?? 'handle.invalid', did: data.did };
	}

	return response.data;
}

export async function getBlentoOrBskyProfile(data: { did: Did; client?: Client }): Promise<
	Awaited<ReturnType<typeof getDetailedProfile>> & {
		hasBlento: boolean;
		url?: string;
	}
> {
	let blentoProfile;
	try {
		blentoProfile = await getRecord({
			collection: 'site.standard.publication',
			did: data?.did,
			rkey: 'blento.self',
			client: data?.client
		});
	} catch {
		// User doesn't have a blento publication — expected for most users
	}

	let response;
	try {
		response = await getDetailedProfile(data);
	} catch {
		// public API or PDS unreachable — return minimal profile
	}

	const avatar = blentoProfile?.value?.icon
		? getCDNImageBlobUrl({ did: data?.did, blob: blentoProfile?.value?.icon })
		: response?.avatar;

	return {
		did: data.did,
		handle: response?.handle ?? (data.did as `${string}.${string}`),
		displayName: blentoProfile?.value?.name || response?.displayName || response?.handle,
		avatar: avatar as `${string}:${string}`,
		hasBlento: Boolean(blentoProfile?.value),
		url: blentoProfile?.value?.url as string | undefined
	};
}

/**
 * Creates an AT Protocol client for a user's PDS.
 */
export async function getClient({ did }: { did: Did }) {
	const pds = await getPDS(did);
	if (!pds) throw new Error('PDS not found');

	const client = new Client({
		handler: simpleFetchHandler({ service: pds })
	});

	return client;
}

/**
 * Lists records from a repository collection with pagination support.
 */
export async function listRecords({
	did,
	collection,
	cursor,
	limit = 100,
	client
}: {
	did?: Did;
	collection: `${string}.${string}.${string}`;
	cursor?: string;
	limit?: number;
	client?: Client;
}) {
	did ??= user.did;
	if (!collection) {
		throw new Error('Missing parameters for listRecords');
	}
	if (!did) {
		throw new Error('Missing did for getRecord');
	}

	client ??= await getClient({ did });

	const allRecords = [];

	let currentCursor = cursor;
	do {
		const response = await client.get('com.atproto.repo.listRecords', {
			params: {
				repo: did,
				collection,
				limit: !limit || limit > 100 ? 100 : limit,
				cursor: currentCursor
			}
		});

		if (!response.ok) {
			return allRecords;
		}

		allRecords.push(...response.data.records);
		currentCursor = response.data.cursor;
	} while (currentCursor && (!limit || allRecords.length < limit));

	return allRecords;
}

/**
 * Fetches a single record from a repository.
 */
export async function getRecord({
	did,
	collection,
	rkey = 'self',
	client
}: {
	did?: Did;
	collection: Collection;
	rkey?: string;
	client?: Client;
}) {
	did ??= user.did;

	if (!collection) {
		throw new Error('Missing parameters for getRecord');
	}
	if (!did) {
		throw new Error('Missing did for getRecord');
	}

	client ??= await getClient({ did });

	const record = await client.get('com.atproto.repo.getRecord', {
		params: {
			repo: did,
			collection,
			rkey
		}
	});

	if (!record.ok)
		throw new Error((record.data as { message?: string })?.message ?? 'Record not found');

	return JSON.parse(JSON.stringify(record.data));
}

/**
 * Creates or updates a record in the current user's repository via server-side proxy.
 */
export async function putRecord({
	collection,
	rkey = 'self',
	record
}: {
	collection: AllowedCollection;
	rkey?: string;
	record: Record<string, unknown>;
}) {
	const { putRecord: serverPutRecord } = await import('./server/repo.remote');
	return serverPutRecord({ collection, rkey, record });
}

/**
 * Deletes a record from the current user's repository via server-side proxy.
 */
export async function deleteRecord({
	collection,
	rkey = 'self'
}: {
	collection: AllowedCollection;
	rkey: string;
}) {
	const { deleteRecord: serverDeleteRecord } = await import('./server/repo.remote');
	const result = await serverDeleteRecord({ collection, rkey });
	return result.ok;
}

/**
 * Uploads a blob to the current user's PDS via server-side proxy.
 */
export async function uploadBlob({ blob }: { blob: Blob }) {
	const { uploadBlob: serverUploadBlob } = await import('./server/repo.remote');
	const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
	return serverUploadBlob({ bytes, mimeType: blob.type });
}

/**
 * Gets metadata about a repository.
 */
export async function describeRepo({ client, did }: { client?: Client; did?: Did }) {
	did ??= user.did;
	if (!did) {
		throw new Error('Error describeRepo: No did');
	}
	client ??= await getClient({ did });

	const repo = await client.get('com.atproto.repo.describeRepo', {
		params: {
			repo: did
		}
	});
	if (!repo.ok) return;

	return repo.data;
}

/**
 * Constructs a URL to fetch a blob directly from a user's PDS.
 */
export async function getBlobURL({
	did,
	blob
}: {
	did: Did;
	blob: {
		$type: 'blob';
		ref: {
			$link: string;
		};
	};
}) {
	const pds = await getPDS(did);
	return `${pds}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${blob.ref.$link}`;
}

/**
 * Constructs a Bluesky CDN URL for an image blob.
 */
export function getCDNImageBlobUrl({
	did,
	blob,
	type = 'webp'
}: {
	did?: string;
	blob: {
		$type: 'blob';
		ref: {
			$link: string;
		};
	};
	type?: 'webp' | 'jpeg';
}) {
	if (!blob || !did) return;
	did ??= user.did;

	return `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${blob.ref.$link}@${type}`;
}

/**
 * Searches for actors with typeahead/autocomplete functionality.
 */
export async function searchActorsTypeahead(
	q: string,
	limit: number = 10,
	host?: string
): Promise<{ actors: AppBskyActorDefs.ProfileViewBasic[]; q: string }> {
	host ??= 'https://public.api.bsky.app';

	const client = new Client({
		handler: simpleFetchHandler({ service: host })
	});

	const response = await client.get('app.bsky.actor.searchActorsTypeahead', {
		params: {
			q,
			limit
		}
	});

	if (!response.ok) return { actors: [], q };

	return { actors: response.data.actors, q };
}

/**
 * Return a TID based on current time
 */
export function createTID() {
	return TID.now();
}

export async function getAuthorFeed(data?: {
	did?: Did;
	client?: Client;
	filter?: string;
	limit?: number;
	cursor?: string;
}) {
	data ??= {};
	data.did ??= user.did;

	if (!data.did) throw new Error('Error getting detailed profile: no did');

	data.client ??= new Client({
		handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' })
	});

	const response = await data.client.get('app.bsky.feed.getAuthorFeed', {
		params: {
			actor: data.did,
			filter: data.filter ?? 'posts_with_media',
			limit: data.limit || 100,
			cursor: data.cursor
		}
	});

	if (!response.ok) return;

	return response.data;
}

/**
 * Fetches posts by their AT URIs.
 */
export async function getPosts(data: { uris: string[]; client?: Client }) {
	data.client ??= new Client({
		handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' })
	});

	const response = await data.client.get('app.bsky.feed.getPosts', {
		params: { uris: data.uris as ResourceUri[] }
	});

	if (!response.ok) return;

	return response.data.posts;
}

export function getHandleOrDid(profile: AppBskyActorDefs.ProfileViewDetailed): ActorIdentifier {
	if (profile.handle && profile.handle !== 'handle.invalid') {
		return profile.handle;
	} else {
		return profile.did;
	}
}

/**
 * Fetches a post's thread including replies.
 */
export async function getPostThread({
	uri,
	depth = 1,
	client
}: {
	uri: string;
	depth?: number;
	client?: Client;
}) {
	client ??= new Client({
		handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' })
	});

	const response = await client.get('app.bsky.feed.getPostThread', {
		params: { uri: uri as ResourceUri, depth }
	});

	if (!response.ok) return;

	return response.data.thread;
}

/**
 * Creates a Bluesky post on the authenticated user's account via server-side proxy.
 */
export async function createPost({
	text,
	facets
}: {
	text: string;
	facets?: Array<{
		index: { byteStart: number; byteEnd: number };
		features: Array<{ $type: string; uri?: string; did?: string; tag?: string }>;
	}>;
}) {
	const record: Record<string, unknown> = {
		$type: 'app.bsky.feed.post',
		text,
		createdAt: new Date().toISOString()
	};

	if (facets) {
		record.facets = facets;
	}

	const { createRecord } = await import('./server/repo.remote');
	return createRecord({ collection: 'app.bsky.feed.post', record });
}
