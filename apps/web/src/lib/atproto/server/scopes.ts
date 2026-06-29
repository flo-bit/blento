import { scope } from '@atcute/oauth-node-client';
import { collections } from '../settings';

export const scopes = [
	'atproto',
	scope.repo({ collection: [...collections] }),
	scope.blob({ accept: ['*/*'] }),
	// Needed to mint a service-auth token for the Bluesky video service: the token
	// is for `com.atproto.repo.uploadBlob` (the video service uploads the blob to
	// the user's PDS), so the session must hold that rpc scope. aud is '*' because
	// each user's PDS DID differs.
	scope.rpc({ lxm: ['com.atproto.repo.uploadBlob'], aud: '*' }),
	'include:app.bsky.authCreatePosts',
	'include:site.standard.authFull'
];
