import { json } from '@sveltejs/kit';
import { contrail, ensureInit } from '$lib/contrail';
import { listRecords } from '$lib/atproto/methods';
import { collections } from '$lib/atproto/settings';
import { getActor } from '$lib/actor';
import type { Did } from '@atcute/lexicons';
import { dev } from '$app/environment';

export async function GET({ params, platform, locals, request }) {
	if (!locals.did) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const actor = await getActor({ request, paramActor: params.actor, platform });
	if (!actor) {
		return json({ error: 'Actor not found' }, { status: 404 });
	}

	if (actor !== locals.did && !dev) {
		return json({ error: 'You can only reindex your own account' }, { status: 403 });
	}

	const db = platform?.env?.DB;
	if (!db) {
		return json({ error: 'Database not available' }, { status: 503 });
	}

	const did = actor as Did;
	await ensureInit(db);

	// Fetch all records from the user's PDS across all tracked collections
	const uris: string[] = [];

	await Promise.all(
		collections.map(async (collection) => {
			try {
				const records = await listRecords({ did, collection, limit: 0 });
				for (const record of records) {
					uris.push(record.uri);
				}
			} catch {
				// Collection may not exist for this user — skip
			}
		})
	);

	if (uris.length === 0) {
		return json({ ok: true, indexed: 0, deleted: 0 });
	}

	const result = await contrail.notify(uris, db);

	return json({ ok: true, indexed: result.indexed, deleted: result.deleted });
}
