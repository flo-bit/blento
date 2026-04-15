import { error } from '@sveltejs/kit';
import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { collections } from '../settings';
import { contrail, ensureInit } from '$lib/contrail';

// Validate collection format and check against allowed list
const collectionSchema = v.pipe(
	v.string(),
	v.regex(/^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z][a-zA-Z0-9-]*){2,}$/),
	v.check(
		(c) => collections.includes(c as (typeof collections)[number]),
		'Collection not in allowed list'
	)
);

// AT Protocol rkey: TID, 'self', or other valid record keys
const rkeySchema = v.optional(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9._:~-]{1,512}$/)));

export const putRecord = command(
	v.object({
		collection: collectionSchema,
		rkey: rkeySchema,
		record: v.record(v.string(), v.unknown())
	}),
	async (input) => {
		const { locals } = getRequestEvent();
		if (!locals.client || !locals.did) error(401, 'Not authenticated');

		const response = await locals.client.post('com.atproto.repo.putRecord', {
			input: {
				collection: input.collection as `${string}.${string}.${string}`,
				repo: locals.did,
				rkey: input.rkey || 'self',
				record: input.record
			}
		});

		if (!response.ok) error(500, 'Failed to put record');

		// Immediately index in contrail
		const { platform } = getRequestEvent();
		const db = platform?.env?.DB;
		if (db) {
			await ensureInit(db);
			await contrail.notify(response.data.uri, db).catch(() => {});
		}

		return response.data;
	}
);

export const deleteRecord = command(
	v.object({
		collection: collectionSchema,
		rkey: rkeySchema
	}),
	async (input) => {
		const { locals, platform } = getRequestEvent();
		if (!locals.client || !locals.did) error(401, 'Not authenticated');

		const rkey = input.rkey || 'self';
		const response = await locals.client.post('com.atproto.repo.deleteRecord', {
			input: {
				collection: input.collection as `${string}.${string}.${string}`,
				repo: locals.did,
				rkey
			}
		});

		// Tell contrail the record is gone — notify() re-fetches and removes on 404
		const db = platform?.env?.DB;
		if (db && response.ok) {
			await ensureInit(db);
			const uri = `at://${locals.did}/${input.collection}/${rkey}`;
			await contrail.notify(uri, db).catch(() => {});
		}

		return { ok: response.ok };
	}
);

export const uploadBlob = command(
	v.object({
		bytes: v.array(v.number()),
		mimeType: v.string()
	}),
	async (input) => {
		const { locals } = getRequestEvent();
		if (!locals.client || !locals.did) error(401, 'Not authenticated');

		const blob = new Blob([new Uint8Array(input.bytes)], { type: input.mimeType });

		const response = await locals.client.post('com.atproto.repo.uploadBlob', {
			params: { repo: locals.did },
			input: blob
		});

		if (!response.ok) error(500, 'Upload failed');

		return response.data.blob as {
			$type: 'blob';
			ref: { $link: string };
			mimeType: string;
			size: number;
		};
	}
);

export const createRecord = command(
	v.object({
		collection: collectionSchema,
		record: v.record(v.string(), v.unknown())
	}),
	async (input) => {
		const { locals } = getRequestEvent();
		if (!locals.client || !locals.did) error(401, 'Not authenticated');

		const response = await locals.client.post('com.atproto.repo.createRecord', {
			input: {
				collection: input.collection as `${string}.${string}.${string}`,
				repo: locals.did,
				record: input.record
			}
		});

		if (!response.ok) error(500, 'Failed to create record');

		// Immediately index in contrail
		const { platform } = getRequestEvent();
		const db = platform?.env?.DB;
		if (db) {
			await ensureInit(db);
			await contrail.notify(response.data.uri, db).catch(() => {});
		}

		return response.data;
	}
);
