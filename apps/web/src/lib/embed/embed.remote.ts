import { error } from '@sveltejs/kit';
import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { isAllowedCollection, isAllowedOrigin } from './allowlist';
import { contrail, ensureInit } from '$lib/contrail';

const originSchema = v.string();

const collectionSchema = v.pipe(
	v.string(),
	v.regex(/^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z][a-zA-Z0-9-]*){2,}$/)
);

const rkeySchema = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9._:~-]{1,512}$/));

const recordSchema = v.record(v.string(), v.unknown());

const writeSchema = v.union([
	v.object({
		$type: v.literal('create'),
		collection: collectionSchema,
		rkey: v.optional(rkeySchema),
		value: recordSchema
	}),
	v.object({
		$type: v.literal('update'),
		collection: collectionSchema,
		rkey: rkeySchema,
		value: recordSchema
	}),
	v.object({
		$type: v.literal('delete'),
		collection: collectionSchema,
		rkey: rkeySchema
	})
]);

function requireAuth() {
	const { locals } = getRequestEvent();
	if (!locals.client || !locals.did) error(401, 'no_session');
	return { client: locals.client, did: locals.did };
}

function checkOrigin(origin: string) {
	if (!isAllowedOrigin(origin)) error(403, 'origin_not_allowed');
}

function checkCollection(origin: string, collection: string) {
	if (!isAllowedCollection(origin, collection)) error(403, 'collection_not_allowed');
}

async function notifyContrail(uri: string) {
	const { platform } = getRequestEvent();
	const db = platform?.env?.DB;
	if (!db) return;
	await ensureInit(db);
	await contrail.notify(uri, db).catch(() => {});
}

export const embedCreateRecord = command(
	v.object({
		origin: originSchema,
		collection: collectionSchema,
		rkey: v.optional(rkeySchema),
		record: recordSchema
	}),
	async ({ origin, collection, rkey, record }) => {
		const { client, did } = requireAuth();
		checkOrigin(origin);
		checkCollection(origin, collection);

		const response = await client.post('com.atproto.repo.createRecord', {
			input: {
				collection: collection as `${string}.${string}.${string}`,
				repo: did,
				rkey,
				record
			}
		});

		if (!response.ok) {
			console.error('embedCreateRecord failed', {
				origin,
				collection,
				status: response.status,
				data: response.data
			});
			error(502, 'pds_error');
		}

		await notifyContrail(response.data.uri);

		return { uri: response.data.uri, cid: response.data.cid };
	}
);

export const embedPutRecord = command(
	v.object({
		origin: originSchema,
		collection: collectionSchema,
		rkey: rkeySchema,
		record: recordSchema
	}),
	async ({ origin, collection, rkey, record }) => {
		const { client, did } = requireAuth();
		checkOrigin(origin);
		checkCollection(origin, collection);

		const valueWithType = record.$type === collection ? record : { ...record, $type: collection };

		const response = await client.post('com.atproto.repo.putRecord', {
			input: {
				collection: collection as `${string}.${string}.${string}`,
				repo: did,
				rkey,
				record: valueWithType
			}
		});

		if (!response.ok) {
			console.error('embedPutRecord failed', {
				origin,
				collection,
				rkey,
				status: response.status,
				data: response.data
			});
			error(502, 'pds_error');
		}

		await notifyContrail(response.data.uri);

		return { uri: response.data.uri, cid: response.data.cid };
	}
);

export const embedDeleteRecord = command(
	v.object({
		origin: originSchema,
		collection: collectionSchema,
		rkey: rkeySchema
	}),
	async ({ origin, collection, rkey }) => {
		const { client, did } = requireAuth();
		checkOrigin(origin);
		checkCollection(origin, collection);

		const response = await client.post('com.atproto.repo.deleteRecord', {
			input: {
				collection: collection as `${string}.${string}.${string}`,
				repo: did,
				rkey
			}
		});

		if (response.ok) {
			await notifyContrail(`at://${did}/${collection}/${rkey}`);
		}

		return { ok: response.ok };
	}
);

export const embedApplyWrites = command(
	v.object({
		origin: originSchema,
		writes: v.array(writeSchema),
		validate: v.optional(v.boolean())
	}),
	async ({ origin, writes, validate }) => {
		const { client, did } = requireAuth();
		checkOrigin(origin);
		for (const w of writes) checkCollection(origin, w.collection);

		const atprotoWrites = writes.map((w) => {
			if (w.$type === 'create') {
				return {
					$type: 'com.atproto.repo.applyWrites#create' as const,
					collection: w.collection as `${string}.${string}.${string}`,
					rkey: w.rkey,
					value:
						(w.value as { $type?: string }).$type === w.collection
							? w.value
							: { ...w.value, $type: w.collection }
				};
			}
			if (w.$type === 'update') {
				return {
					$type: 'com.atproto.repo.applyWrites#update' as const,
					collection: w.collection as `${string}.${string}.${string}`,
					rkey: w.rkey,
					value:
						(w.value as { $type?: string }).$type === w.collection
							? w.value
							: { ...w.value, $type: w.collection }
				};
			}
			return {
				$type: 'com.atproto.repo.applyWrites#delete' as const,
				collection: w.collection as `${string}.${string}.${string}`,
				rkey: w.rkey
			};
		});

		const response = await client.post('com.atproto.repo.applyWrites', {
			input: { repo: did, validate, writes: atprotoWrites }
		});

		if (!response.ok) {
			console.error('embedApplyWrites failed', {
				origin,
				count: writes.length,
				status: response.status,
				data: response.data
			});
			error(502, 'pds_error');
		}

		const results =
			response.data.results?.map((r) => ({
				uri: 'uri' in r ? (r.uri as string | undefined) : undefined,
				cid: 'cid' in r ? (r.cid as string | undefined) : undefined
			})) ?? [];

		for (const r of results) {
			if (r.uri) await notifyContrail(r.uri);
		}

		return { results };
	}
);

export const embedUploadBlob = command(
	v.object({
		origin: originSchema,
		bytes: v.array(v.number()),
		mimeType: v.string()
	}),
	async ({ origin, bytes, mimeType }) => {
		const { client } = requireAuth();
		checkOrigin(origin);

		const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });

		const response = await client.post('com.atproto.repo.uploadBlob', {
			input: blob
		});

		if (!response.ok) {
			console.error('embedUploadBlob failed', {
				origin,
				size: bytes.length,
				status: response.status,
				data: response.data
			});
			error(502, 'pds_error');
		}

		return response.data.blob as {
			$type: 'blob';
			ref: { $link: string };
			mimeType: string;
			size: number;
		};
	}
);
