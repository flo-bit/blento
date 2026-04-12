import { scope } from '@atcute/oauth-node-client';
import { collections } from '../settings';

export const scopes = [
	'atproto',
	scope.repo({ collection: [...collections] }),
	scope.blob({ accept: ['*/*'] }),
	'include:app.bsky.authCreatePosts',
	'include:site.standard.authFull'
];
