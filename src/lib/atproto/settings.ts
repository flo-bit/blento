import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

export const SITE = env.PUBLIC_DOMAIN;

export const collections = [
	'app.blento.card',
	'app.blento.page',
	'app.blento.settings',
	'app.blento.comment',
	'app.blento.guestbook.entry',
	'site.standard.publication',
	'site.standard.document',
	'xyz.statusphere.status',
	'community.lexicon.calendar.rsvp',
	'community.lexicon.calendar.event',
	'app.nearhorizon.actor.pronouns',
	'app.bsky.feed.post'
] as const;

export type AllowedCollection = (typeof collections)[number];

// which PDS to use for signup
const devPDS = 'https://pds.rip/';
const prodPDS = 'https://selfhosted.social/';
export const signUpPDS = dev ? devPDS : prodPDS;

// where to redirect after oauth login/signup
export const REDIRECT_PATH = '/oauth/callback';

export const DOH_RESOLVER = 'https://mozilla.cloudflare-dns.com/dns-query';
