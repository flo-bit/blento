import { goto } from '$app/navigation';
import * as TID from '@atcute/tid';
import {
	putRecord,
	deleteRecord,
	uploadBlob,
	getRecord,
	resolveHandle
} from '$lib/atproto/methods';
import { atProtoLoginModalState } from '$lib/atproto/LoginModal.svelte';
import type {
	EditorAdapter,
	EditorBlobRef,
	EditorViewer
} from '@atmo-dev/events-ui';

export type { EditorAdapter, EditorBlobRef, EditorViewer };

/** atmo.rsvp's appview — reads + indexing-update notifications go here. */
const ATMO_APPVIEW = 'https://atmo.rsvp';

function handleOrDid(viewer: EditorViewer): string {
	if (viewer.handle && viewer.handle !== 'handle.invalid') return viewer.handle;
	return viewer.did ?? '';
}

export function createBlentoEditorAdapter(opts: { viewer: EditorViewer }): EditorAdapter {
	const { viewer } = opts;
	return {
		features: { delete: true, recurring: true, privateMode: false },
		async putRecord({ collection, rkey, record }) {
			const result = await putRecord({
				collection: collection as Parameters<typeof putRecord>[0]['collection'],
				rkey,
				record
			});
			return { uri: result.uri };
		},
		async createRecord({ collection, rkey, record }) {
			// Blento's atproto layer only exposes putRecord; both create and update
			// flow through it. The PDS would normally assign an rkey when omitted,
			// but our path requires one — generate a TID if the caller didn't.
			const finalRkey = rkey ?? TID.now();
			const result = await putRecord({
				collection: collection as Parameters<typeof putRecord>[0]['collection'],
				rkey: finalRkey,
				record
			});
			return { uri: result.uri, cid: result.cid };
		},
		async deleteRecord({ collection, rkey }) {
			await deleteRecord({
				collection: collection as Parameters<typeof deleteRecord>[0]['collection'],
				rkey
			});
		},
		async uploadBlob(blob) {
			const result = await uploadBlob({ blob });
			if (!result) throw new Error('uploadBlob failed');
			const { aspectRatio: _ar, ...rest } = result as Record<string, unknown> & {
				aspectRatio?: unknown;
			};
			return rest as unknown as EditorBlobRef;
		},
		async getRecord({ did, collection, rkey }) {
			const fresh = await getRecord({
				did: did as `did:${string}:${string}`,
				collection: collection as Parameters<typeof getRecord>[0]['collection'],
				rkey
			});
			const value = (fresh as { value?: Record<string, unknown> }).value ?? {};
			return { value };
		},
		async resolveHandle(handle: string) {
			return resolveHandle({ handle: handle as Parameters<typeof resolveHandle>[0]['handle'] });
		},
		onSaved({ rkey, isNew }) {
			const handle = handleOrDid(viewer);
			goto(`/${handle}/event/r/${rkey}${isNew ? '?created=true' : ''}`);
		},
		onDeleted() {
			const handle = handleOrDid(viewer);
			goto(`/${handle}`);
		},
		requestLogin() {
			atProtoLoginModalState.show();
		},
		async notifyUpdate(uri) {
			// Hint atmo's contrail to re-index this record immediately. Without this
			// the firehose-based update happens on a ~1min cadence; with it, atmo's
			// appview catches the change in well under a second. Fire-and-forget.
			try {
				await fetch(`${ATMO_APPVIEW}/xrpc/rsvp.atmo.notifyOfUpdate`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ uri })
				});
			} catch {
				// best-effort; firehose will catch up
			}
		}
		// no createPrivateEvent / putSpaceRecord / deleteSpaceRecord / createSpaceInvite —
		// blento doesn't have spaces (privateMode: false in features).
	};
}
