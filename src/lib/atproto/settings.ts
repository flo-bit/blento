import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

export const SITE = env.PUBLIC_DOMAIN;

export const collections = [
	'app.blento.card',
	'app.blento.page',
	'app.blento.section',
	'app.blento.settings',
	'app.blento.comment',
	'app.blento.guestbook.entry',
	'site.standard.publication',
	'site.standard.document',
	'xyz.statusphere.status',
	'community.lexicon.calendar.rsvp',
	'community.lexicon.calendar.event',
	'app.nearhorizon.actor.pronouns'
] as const;

export type AllowedCollection = (typeof collections)[number];

// Collections the server will accept in putRecord/createRecord/deleteRecord.
// Superset of `collections` — includes collections we can write via the OAuth
// scope granted by the PDS but don't need to list explicitly in our scope
// request (e.g. app.bsky.feed.post for cross-posting).
export const writableCollections = [...collections, 'app.bsky.feed.post'] as const;

// which PDS to use for signup
const devPDS = 'https://pds.rip/';
const prodPDS = 'https://selfhosted.social/';
export const signUpPDS = dev ? devPDS : prodPDS;

// where to redirect after oauth login/signup
export const REDIRECT_PATH = '/oauth/callback';

export const DOH_RESOLVER = 'https://mozilla.cloudflare-dns.com/dns-query';
