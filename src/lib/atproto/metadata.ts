import { resolve } from '$app/paths';
import { permissions, REDIRECT_PATH, SITE } from './settings';

function constructScope() {
	const repos = permissions.collections.map((collection) => 'repo:' + collection).join(' ');

	let rpcs = '';
	for (const [key, value] of Object.entries(permissions.rpc ?? {})) {
		if (Array.isArray(value)) {
			rpcs += value.map((lxm) => 'rpc?lxm=' + lxm + '&aud=' + key).join(' ');
		} else {
			rpcs += 'rpc?lxm=' + value + '&aud=' + key;
		}
	}

	let blobScope: string | undefined = undefined;
	if (Array.isArray(permissions.blobs) && permissions.blobs.length > 0) {
		blobScope = 'blob?' + permissions.blobs.map((b) => 'accept=' + b).join('&');
	} else if (permissions.blobs && permissions.blobs.length > 0) {
		blobScope = 'blob:' + permissions.blobs;
	}

	const scope = ['atproto', repos, rpcs, blobScope].filter((v) => v?.trim()).join(' ');
	return scope;
}

export const metadata = {
	client_id: SITE + resolve('/oauth-client-metadata.json'),
	redirect_uris: [SITE + resolve(REDIRECT_PATH)],
	scope: constructScope(),
	grant_types: ['authorization_code', 'refresh_token'],
	response_types: ['code'],
	token_endpoint_auth_method: 'none',
	application_type: 'web',
	dpop_bound_access_tokens: true
};
