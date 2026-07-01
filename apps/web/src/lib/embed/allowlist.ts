import { dev } from '$app/environment';

export type AllowlistEntry = {
	collectionPrefixes: string[];
	label: string;
};

const PROD_ALLOWLIST: Record<string, AllowlistEntry> = {
	'https://atmo.rsvp': {
		collectionPrefixes: ['community.lexicon.calendar.', 'app.bsky.feed.post'],
		label: 'atmo.rsvp'
	}
};

const DEV_ALLOWLIST: Record<string, AllowlistEntry> = {
	'http://localhost:5173': { collectionPrefixes: ['*'], label: 'Local dev (5173)' },
	'http://localhost:5174': { collectionPrefixes: ['*'], label: 'Local dev (5174)' },
	'http://127.0.0.1:5173': { collectionPrefixes: ['*'], label: 'Local dev (5173 IP)' },
	'http://127.0.0.1:5174': { collectionPrefixes: ['*'], label: 'Local dev (5174 IP)' }
};

export const ALLOWLIST: Record<string, AllowlistEntry> = dev
	? { ...PROD_ALLOWLIST, ...DEV_ALLOWLIST }
	: PROD_ALLOWLIST;

export function getAllowlistEntry(origin: string): AllowlistEntry | null {
	return ALLOWLIST[origin] ?? null;
}

export function isAllowedOrigin(origin: string): boolean {
	return origin in ALLOWLIST;
}

function matchesPrefix(collection: string, prefix: string): boolean {
	if (prefix === '*') return true;
	if (prefix.endsWith('.')) return collection.startsWith(prefix);
	return collection === prefix;
}

export function isAllowedCollection(origin: string, collection: string): boolean {
	const entry = ALLOWLIST[origin];
	if (!entry) return false;
	return entry.collectionPrefixes.some((p) => matchesPrefix(collection, p));
}
