import { base } from '$app/paths';

import { env } from '$env/dynamic/public';

export const metadata = {
	client_id: `${env.PUBLIC_DOMAIN}${base}/oauth-client-metadata.json`,

	redirect_uris: [env.PUBLIC_DOMAIN + base],

	scope:
		'atproto repo:app.blento.card repo:app.blento.page repo:app.blento.settings repo:app.blento.comment repo:site.standard.publication repo:site.standard.document repo:app.blento.guestbook.entry repo:xyz.statusphere.status repo:app.bsky.feed.like blob:*/* rpc:app.bsky.actor.getProfile?aud=did:web:api.bsky.app%23bsky_appview',
	grant_types: ['authorization_code', 'refresh_token'],
	response_types: ['code'],
	token_endpoint_auth_method: 'none',
	application_type: 'web',
	dpop_bound_access_tokens: true
};
