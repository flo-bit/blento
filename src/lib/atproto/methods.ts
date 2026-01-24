import type { Did, Handle } from '@atcute/lexicons';
import { user } from './auth.svelte';
import {
	CompositeDidDocumentResolver,
	CompositeHandleResolver,
	DohJsonHandleResolver,
	PlcDidDocumentResolver,
	WebDidDocumentResolver,
	WellKnownHandleResolver
} from '@atcute/identity-resolver';
import { Client, simpleFetchHandler } from '@atcute/client';
import type { AppBskyActorDefs } from '@atcute/bluesky';

export type Collection = `${string}.${string}.${string}`;

export function parseUri(uri: string) {
	const [did, collection, rkey] = uri.replace('at://', '').split('/');
	return { did, collection, rkey } as {
		collection: `${string}.${string}.${string}`;
		rkey: string;
		did: Did;
	};
}

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

export async function getPDS(did: Did) {
	const doc = await didResolver.resolve(did as `did:plc:${string}` | `did:web:${string}`);
	if (!doc.service) throw new Error('No PDS found');
	for (const service of doc.service) {
		if (service.id === '#atproto_pds') {
			return service.serviceEndpoint.toString();
		}
	}
}

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

	if (!response.ok) return;

	return response.data;
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

export async function getClient({ did }: { did: Did }) {
	const pds = await getPDS(did);
	if (!pds) throw new Error('PDS not found');

	const client = new Client({
		handler: simpleFetchHandler({ service: pds })
	});

	return client;
}

export async function listRecords({
	did,
	collection,
	cursor,
	limit = 0,
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
				limit: limit || 100,
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

export async function getRecord({
	did,
	collection,
	rkey,
	client
}: {
	did?: Did;
	collection: Collection;
	rkey?: string;
	client?: Client;
}) {
	did ??= user.did;
	rkey ??= 'self';

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

export async function putRecord({
	collection,
	rkey,
	record
}: {
	collection: Collection;
	rkey: string;
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

export async function deleteRecord({ collection, rkey }: { collection: Collection; rkey: string }) {
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

export async function uploadBlob({ blob }: { blob: Blob }) {
	if (!user.did || !user.client) throw new Error("Can't upload blob: Not logged in");

	const blobResponse = await user.client.post('com.atproto.repo.uploadBlob', {
		input: blob,
		data: {
			repo: user.did
		}
	});

	if (!blobResponse?.ok) {
		return;
	}

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

export function getImageBlobUrl({
	did,
	blob
}: {
	did: string;
	blob: {
		$type: 'blob';
		ref: {
			$link: string;
		};
	};
}) {
	if (!did || !blob?.ref?.$link) return '';
	return `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${blob.ref.$link}@webp`;
}

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
