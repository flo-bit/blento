import type { ContrailConfig } from '@atmo-dev/contrail';

export const config: ContrailConfig = {
	namespace: 'app.blento',
	collections: {
		'app.blento.card': {
			queryable: {
				page: {},
				cardType: {}
			}
		},
		'app.blento.page': {
			queryable: {}
		}
	},
	profiles: [
		'app.bsky.actor.profile',
		{ collection: 'site.standard.publication', rkey: 'blento.self' }
	]
};
