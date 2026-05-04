import type { ContrailConfig } from '@atmo-dev/contrail';

export const config: ContrailConfig = {
	namespace: 'app.blento',
	collections: {
		card: {
			collection: 'app.blento.card',
			queryable: {
				page: {},
				cardType: {}
			}
		},
		page: {
			collection: 'app.blento.page'
		},
		section: {
			collection: 'app.blento.section',
			queryable: {
				page: {},
				sectionType: {}
			}
		}
	},
	profiles: [
		'app.bsky.actor.profile',
		{ collection: 'site.standard.publication', rkey: 'blento.self' },
		{ collection: 'app.nearhorizon.actor.pronouns', rkey: 'self' }
	]
};
