import { getBlentoOrBskyProfile, getRecord, listRecords, parseUri } from '$lib/atproto/methods';
import type { CacheService, CachedProfile } from '$lib/cache';
import type { EventData } from '$lib/cards/social/EventCard';
import type { Did } from '@atcute/lexicons';

export type RsvpStatus = 'going' | 'interested';

export interface ResolvedRsvp {
	event: EventData;
	rkey: string;
	hostDid: string;
	hostProfile: CachedProfile | null;
	status: 'going' | 'interested';
	eventUri: string;
}

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

interface RsvpRecord {
	$type: string;
	status: string;
	subject: { uri: string; cid?: string };
	createdAt: string;
}

/**
 * Fetch a user's RSVPs (going/interested) and resolve each referenced event + host profile.
 */
export async function fetchUserRsvps(
	did: string,
	cache?: CacheService | null
): Promise<ResolvedRsvp[]> {
	const rsvpRecords = await listRecords({
		did: did as Did,
		collection: 'community.lexicon.calendar.rsvp',
		limit: 100
	});

	const activeRsvps = rsvpRecords.filter((r) => {
		const rsvp = r.value as unknown as RsvpRecord;
		return rsvp.status?.endsWith('#going') || rsvp.status?.endsWith('#interested');
	});

	const results = await Promise.all(
		activeRsvps.map(async (r) => {
			const rsvp = r.value as unknown as RsvpRecord;
			const parsed = parseUri(rsvp.subject.uri);
			if (!parsed?.rkey || !parsed?.repo) return null;

			try {
				const [record, hostProfile] = await Promise.all([
					getRecord({
						did: parsed.repo as Did,
						collection: 'community.lexicon.calendar.event',
						rkey: parsed.rkey
					}),
					resolveProfile(parsed.repo, cache).catch(() => null)
				]);

				if (!record?.value) return null;

				return {
					event: record.value as EventData,
					rkey: parsed.rkey,
					hostDid: parsed.repo,
					hostProfile,
					status: (rsvp.status?.endsWith('#going') ? 'going' : 'interested') as
						| 'going'
						| 'interested',
					eventUri: rsvp.subject.uri
				};
			} catch {
				return null;
			}
		})
	);

	return results.filter((r) => r !== null);
}
