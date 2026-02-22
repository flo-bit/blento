import { getBlentoOrBskyProfile, parseUri } from '$lib/atproto/methods';
import type { CacheService, CachedProfile } from '$lib/cache';
import type { Did } from '@atcute/lexicons';

export type RsvpStatus = 'going' | 'interested';

/**
 * Fetch raw RSVP data for an event from Microcosm Constellation backlinks.
 * Returns a map of DID -> status (going/interested).
 */
export async function fetchEventRsvps(eventUri: string): Promise<Map<string, RsvpStatus>> {
	const allRecords: Record<string, unknown> = {};
	let cursor: string | undefined;

	do {
		const params: Record<string, unknown> = {
			subject: eventUri,
			source: 'community.lexicon.calendar.rsvp:subject.uri'
		};
		if (cursor) params.cursor = cursor;

		const res = await fetch(
			'https://slingshot.microcosm.blue/xrpc/com.bad-example.proxy.hydrateQueryResponse',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					atproto_proxy: 'did:web:constellation.microcosm.blue#constellation',
					hydration_sources: [{ path: 'records[]', shape: 'at-uri-parts' }],
					params,
					xrpc: 'blue.microcosm.links.getBacklinks'
				})
			}
		);

		if (!res.ok) break;

		const data = await res.json();
		for (const [key, value] of Object.entries(data.records ?? {})) {
			allRecords[key] = value;
		}
		cursor = data.output?.cursor || undefined;
	} while (cursor);

	const rsvpMap = new Map<string, RsvpStatus>();

	for (const [uri, raw] of Object.entries(allRecords)) {
		const record = raw as { value?: { status?: string } };
		const parts = parseUri(uri);
		const repo = parts?.repo;
		if (!repo) continue;

		const status = record.value?.status || '';
		if (status.includes('#going')) {
			rsvpMap.set(repo, 'going');
		} else if (status.includes('#interested')) {
			rsvpMap.set(repo, 'interested');
		}
	}

	return rsvpMap;
}

/**
 * Resolve a DID to a profile using cache or getBlentoOrBskyProfile as fallback.
 */
export async function resolveProfile(
	did: string,
	cache?: CacheService | null
): Promise<CachedProfile | null> {
	if (cache) {
		const profile = await cache.getProfile(did as Did).catch(() => null);
		if (profile) return profile;
	}
	const p = await getBlentoOrBskyProfile({ did: did as Did }).catch(() => null);
	if (!p) return null;
	return {
		did: p.did as string,
		handle: p.handle as string,
		displayName: p.displayName as string | undefined,
		avatar: p.avatar as string | undefined,
		hasBlento: p.hasBlento,
		url: p.url
	};
}

/**
 * Resolve a DID to a handle using cache or getBlentoOrBskyProfile as fallback.
 */
export async function resolveHandleForDid(
	did: string,
	cache?: CacheService | null
): Promise<string | null> {
	const profile = await resolveProfile(did, cache);
	return profile?.handle && profile.handle !== 'handle.invalid' ? profile.handle : null;
}

/**
 * Get a profile URL for a user. Uses their Blento URL if they have one,
 * otherwise falls back to their Bluesky profile.
 */
export function getProfileUrl(did: string, profile?: CachedProfile | null): string {
	if (profile?.hasBlento) {
		return profile.url || `https://blento.app/${profile.handle || did}`;
	}
	const handle = profile?.handle;
	return handle ? `https://bsky.app/profile/${handle}` : `https://bsky.app/profile/${did}`;
}
