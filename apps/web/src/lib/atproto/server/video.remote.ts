import { error } from '@sveltejs/kit';
import { command, getRequestEvent } from '$app/server';
import {
	CompositeDidDocumentResolver,
	PlcDidDocumentResolver,
	WebDidDocumentResolver
} from '@atcute/identity-resolver';
import type { Did } from '@atcute/lexicons';

const didResolver = new CompositeDidDocumentResolver({
	methods: {
		plc: new PlcDidDocumentResolver(),
		web: new WebDidDocumentResolver()
	}
});

/** Resolve the host of a DID's PDS (e.g. `morel.us-east.host.bsky.network`). */
async function getPdsHost(did: Did): Promise<string> {
	const doc = await didResolver.resolve(did as Did<'plc'> | Did<'web'>);
	const pds = doc.service?.find((s) => s.id === '#atproto_pds');
	if (!pds) throw new Error('No PDS found in DID document');
	return new URL(pds.serviceEndpoint.toString()).host;
}

/**
 * Mint a short-lived service-auth token that the browser uses to upload a video
 * directly to the Bluesky video service (video.bsky.app). The service transcodes
 * the video to HLS and stores the resulting blob in the user's PDS on their behalf
 * — so the token is scoped to the `com.atproto.repo.uploadBlob` method with the
 * user's own PDS as the audience.
 *
 * We mint server-side (the OAuth session lives on the server) but do the actual
 * multi-megabyte upload client-side, straight to video.bsky.app, to avoid routing
 * the bytes through our Worker.
 */
export const getVideoUploadToken = command(async () => {
	const { locals } = getRequestEvent();
	if (!locals.client || !locals.did) error(401, 'Not authenticated');

	const pdsHost = await getPdsHost(locals.did);

	const response = await locals.client.get('com.atproto.server.getServiceAuth', {
		params: {
			aud: `did:web:${pdsHost}`,
			lxm: 'com.atproto.repo.uploadBlob',
			// 30 minutes — plenty for an upload + transcode.
			exp: Math.floor(Date.now() / 1000) + 60 * 30
		}
	});

	if (!response.ok) {
		const data = response.data as { error?: string; message?: string } | undefined;
		const detail = data?.error
			? `${data.error}${data.message ? `: ${data.message}` : ''}`
			: `status ${response.status}`;
		console.error('getServiceAuth failed', response.status, response.data);
		// TEMP: surface the real reason so we can diagnose (scope vs aud vs exp).
		error(500, `Could not authorize video upload — ${detail}`);
	}

	return { token: response.data.token, did: locals.did };
});
