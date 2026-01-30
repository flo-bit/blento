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
 * @param did - The DID to look up
 * @returns The PDS service endpoint URL
 * @throws If no PDS is found in the DID document
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
 * @param data - Optional object with did and client
 * @param data.did - The DID to fetch the profile for (defaults to current user)
 * @param data.client - The client to use (defaults to public Bluesky API)
 * @returns The profile data or undefined if not found
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
	}
> {
	let blentoProfile;
	try {
		// try getting blento profile first
		blentoProfile = await getRecord({
			collection: 'site.standard.publication',
			did: data?.did,
			rkey: 'blento.self',
			client: data?.client
		});
	} catch {
		console.error('error getting blento profile, falling back to bsky profile');
	}

	const response = await getDetailedProfile(data);

	return {
		did: data.did,
		handle: response?.handle,
		displayName: blentoProfile?.value?.name || response?.displayName || response?.handle,
		avatar: (getCDNImageBlobUrl({ did: data?.did, blob: blentoProfile?.value?.icon }) ||
			response?.avatar) as `${string}:${string}`,
		hasBlento: Boolean(blentoProfile.value)
	};
}

/**
 * Creates an AT Protocol client for a user's PDS.
 * @param did - The DID of the user
 * @returns A client configured for the user's PDS
 * @throws If the PDS cannot be found
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
 * @param did - The DID of the repository (defaults to current user)
 * @param collection - The collection to list records from
 * @param cursor - Pagination cursor for continuing from a previous request
 * @param limit - Maximum number of records to return (default 100, set to 0 for all records)
 * @param client - The client to use (defaults to user's PDS client)
 * @returns An array of records from the collection
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
 * @param did - The DID of the repository (defaults to current user)
 * @param collection - The collection the record belongs to
 * @param rkey - The record key (defaults to "self")
 * @param client - The client to use (defaults to user's PDS client)
 * @returns The record data
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

	return JSON.parse(JSON.stringify(record.data));
}

/**
 * Creates or updates a record in the current user's repository.
 * Only accepts collections that are configured in permissions.
 * @param collection - The collection to write to (must be in permissions.collections)
 * @param rkey - The record key (defaults to "self")
 * @param record - The record data to write
 * @returns The response from the PDS
 * @throws If the user is not logged in
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
	if (!user.client || !user.did) throw new Error('No rpc or did');

	const response = await user.client.post('com.atproto.repo.putRecord', {
		input: {
			collection,
			repo: user.did,
			rkey,
			record: {
				...record
			}
		}
	});

	return response;
}

/**
 * Deletes a record from the current user's repository.
 * Only accepts collections that are configured in permissions.
 * @param collection - The collection the record belongs to (must be in permissions.collections)
 * @param rkey - The record key (defaults to "self")
 * @returns True if the deletion was successful
 * @throws If the user is not logged in
 */
export async function deleteRecord({
	collection,
	rkey = 'self'
}: {
	collection: AllowedCollection;
	rkey: string;
}) {
	if (!user.client || !user.did) throw new Error('No profile or rpc or did');

	const response = await user.client.post('com.atproto.repo.deleteRecord', {
		input: {
			collection,
			repo: user.did,
			rkey
		}
	});

	return response.ok;
}

/**
 * Uploads a blob to the current user's PDS.
 * @param blob - The blob data to upload
 * @returns The blob metadata including ref, mimeType, and size, or undefined on failure
 * @throws If the user is not logged in
 */
export async function uploadBlob({ blob }: { blob: Blob }) {
	if (!user.did || !user.client) throw new Error("Can't upload blob: Not logged in");

	const blobResponse = await user.client.post('com.atproto.repo.uploadBlob', {
		params: {
			repo: user.did
		},
		input: blob
	});

	if (!blobResponse?.ok) return;

	const blobInfo = blobResponse?.data.blob as {
		$type: 'blob';
		ref: {
			$link: string;
		};
		mimeType: string;
		size: number;
	};

	return blobInfo;
}

/**
 * Gets metadata about a repository.
 * @param client - The client to use
 * @param did - The DID of the repository (defaults to current user)
 * @returns Repository metadata or undefined on failure
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
 * @param did - The DID of the user who owns the blob
 * @param blob - The blob reference object
 * @returns The URL to fetch the blob
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
 * @param did - The DID of the user who owns the blob (defaults to current user)
 * @param blob - The blob reference object
 * @returns The CDN URL for the image in webp format
 */
export function getCDNImageBlobUrl({
	did,
	blob
}: {
	did?: string;
	blob: {
		$type: 'blob';
		ref: {
			$link: string;
		};
	};
}) {
	if (!blob || !did) return;
	did ??= user.did;

	return `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${blob.ref.$link}@webp`;
}

/**
 * Searches for actors with typeahead/autocomplete functionality.
 * @param q - The search query
 * @param limit - Maximum number of results (default 10)
 * @param host - The API host to use (defaults to public Bluesky API)
 * @returns An object containing matching actors and the original query
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
 *
 * @returns TID for current time
 */
export function createTID() {
	return TID.now();
}

export async function getAuthorFeed(data?: {
	did?: Did;
	client?: Client;
	filter?: string;
	limit?: number;
}) {
	data ??= {};
	data.did ??= user.did;

	if (!data.did) throw new Error('Error getting detailed profile: no did');

	data.client ??= new Client({
		handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' })
	});

	const response = await data.client.get('app.bsky.feed.getAuthorFeed', {
		params: { actor: data.did, filter: data.filter ?? 'posts_with_media', limit: data.limit || 100 }
	});

	if (!response.ok) return;

	return response.data;
}

/**
 * Fetches posts by their AT URIs.
 * @param uris - Array of AT URIs (e.g., "at://did:plc:xyz/app.bsky.feed.post/abc123")
 * @param client - The client to use (defaults to public Bluesky API)
 * @returns Array of posts or undefined on failure
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
 * @param uri - The AT URI of the post
 * @param depth - How many levels of replies to fetch (default 1)
 * @param client - The client to use (defaults to public Bluesky API)
 * @returns The thread data or undefined on failure
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
 * Creates a Bluesky post on the authenticated user's account.
 * @param text - The post text
 * @param facets - Optional rich text facets (links, mentions, etc.)
 * @returns The response containing the post's URI and CID
 * @throws If the user is not logged in
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
	if (!user.client || !user.did) throw new Error('No client or did');

	const record: Record<string, unknown> = {
		$type: 'app.bsky.feed.post',
		text,
		createdAt: new Date().toISOString()
	};

	if (facets) {
		record.facets = facets;
	}

	const response = await user.client.post('com.atproto.repo.createRecord', {
		input: {
			collection: 'app.bsky.feed.post',
			repo: user.did,
			record
		}
	});

	return response;
}
