/**
 * Read-only client for atmo.rsvp's event appview. Hits the public xrpc
 * endpoints over HTTP — no atmo lexicons needed in blento, response shapes
 * are typed structurally to match what `<EventView>`'s `data` prop expects.
 *
 * If the response shapes drift from atmo and types get noisy, the right move
 * is to either pull `rsvp.atmo.*` lexicons into blento's `lex.config.js` or
 * publish them as a shared package.
 */
import type { FlatEventRecord, HostProfile, AttendeeInfo } from '@atmo-dev/events-ui';
import { RSVP_GOING, RSVP_INTERESTED, getProfileUrl } from '@atmo-dev/events-ui';

const ATMO_APPVIEW = 'https://atmo.rsvp';
export const RSVP_HYDRATE_LIMIT = 20;

type AtmoProfileEntry = {
	did: string;
	handle?: string;
	value?: { displayName?: string; avatar?: unknown };
};

type AtmoEventRecord = {
	uri: string;
	cid?: string | null;
	did: string;
	rkey: string;
	value?: Record<string, unknown>;
	rsvps?: unknown;
	rsvpsCount?: number;
	rsvpsGoingCount?: number;
	rsvpsInterestedCount?: number;
	rsvpsNotgoingCount?: number;
	profiles?: AtmoProfileEntry[];
};

type AtmoRsvpRecord = {
	uri: string;
	did: string;
	rkey: string;
	value?: { status?: string; subject?: { uri?: string } };
};

type AtmoListRsvpsResponse = {
	records?: AtmoRsvpRecord[];
	profiles?: AtmoProfileEntry[];
};

async function appviewGet<T>(
	method: string,
	params: Record<string, string | number | boolean>
): Promise<T | null> {
	const qs = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
	try {
		const res = await fetch(`${ATMO_APPVIEW}/xrpc/${method}?${qs}`);
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

function getBlobCid(blob: unknown): string | null {
	if (!blob || typeof blob !== 'object') return null;
	if ('ref' in blob) {
		const ref = (blob as { ref?: { $link?: string } }).ref;
		if (ref?.$link) return ref.$link;
	}
	if ('cid' in blob) {
		const cid = (blob as { cid?: { $link?: string } | string }).cid;
		if (typeof cid === 'string') return cid;
		if (cid && typeof cid === 'object' && '$link' in cid && typeof cid.$link === 'string') {
			return cid.$link;
		}
	}
	return null;
}

function getProfileBlobUrl(did: string, blob: unknown): string | undefined {
	const cid = getBlobCid(blob);
	if (!cid) return undefined;
	return `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid}@webp`;
}

function flattenAtmoEvent(record: AtmoEventRecord): FlatEventRecord | null {
	const body = record.value as Record<string, unknown> | undefined;
	if (!body || typeof body.startsAt !== 'string') return null;
	return {
		...(body as unknown as FlatEventRecord),
		cid: record.cid ?? null,
		did: record.did,
		rkey: record.rkey,
		uri: record.uri,
		...(record.rsvps !== undefined ? { rsvps: record.rsvps as FlatEventRecord['rsvps'] } : {}),
		...(record.rsvpsCount !== undefined ? { rsvpsCount: record.rsvpsCount } : {}),
		...(record.rsvpsGoingCount !== undefined ? { rsvpsGoingCount: record.rsvpsGoingCount } : {}),
		...(record.rsvpsInterestedCount !== undefined
			? { rsvpsInterestedCount: record.rsvpsInterestedCount }
			: {}),
		...(record.rsvpsNotgoingCount !== undefined
			? { rsvpsNotgoingCount: record.rsvpsNotgoingCount }
			: {})
	};
}

export function getHostProfile(did: string, profiles?: AtmoProfileEntry[]): HostProfile | null {
	const profile = profiles?.find((entry) => entry.did === did);
	if (!profile) return null;
	return {
		did,
		handle: profile.handle,
		displayName: profile.value?.displayName,
		avatar: getProfileBlobUrl(did, profile.value?.avatar)
	};
}

function buildAttendee(
	did: string,
	status: 'going' | 'interested',
	profiles?: AtmoProfileEntry[]
): AttendeeInfo {
	const profile = profiles?.find((entry) => entry.did === did);
	const handle = profile?.handle;
	return {
		did,
		status,
		avatar: getProfileBlobUrl(did, profile?.value?.avatar),
		name: profile?.value?.displayName || handle || did,
		handle,
		url: getProfileUrl(handle || did)
	};
}

export function getRsvpStatus(status?: string): 'going' | 'interested' | 'notgoing' | null {
	if (!status) return null;
	if (status === RSVP_GOING || status.endsWith('#going')) return 'going';
	if (status === RSVP_INTERESTED || status.endsWith('#interested')) return 'interested';
	if (status.endsWith('#notgoing')) return 'notgoing';
	return null;
}

export interface AttendeesResult {
	going: AttendeeInfo[];
	interested: AttendeeInfo[];
	goingCount: number;
	interestedCount: number;
}

export async function fetchAtmoEvent({
	did,
	rkey,
	hydrateRsvps = RSVP_HYDRATE_LIMIT,
	profiles = true
}: {
	did: string;
	rkey: string;
	hydrateRsvps?: number;
	profiles?: boolean;
}): Promise<{ flat: FlatEventRecord; raw: AtmoEventRecord } | null> {
	const uri = `at://${did}/community.lexicon.calendar.event/${rkey}`;
	const data = await appviewGet<AtmoEventRecord>('rsvp.atmo.event.getRecord', {
		uri,
		hydrateRsvps,
		profiles
	});
	if (!data) return null;
	const flat = flattenAtmoEvent(data);
	if (!flat) return null;
	return { flat, raw: data };
}

export async function fetchAtmoEventAttendees(eventUri: string): Promise<AttendeesResult> {
	const [going, interested] = await Promise.all([
		appviewGet<AtmoListRsvpsResponse>('rsvp.atmo.rsvp.listRecords', {
			subjectUri: eventUri,
			status: RSVP_GOING,
			profiles: true,
			limit: 200
		}),
		appviewGet<AtmoListRsvpsResponse>('rsvp.atmo.rsvp.listRecords', {
			subjectUri: eventUri,
			status: RSVP_INTERESTED,
			profiles: true,
			limit: 200
		})
	]);

	const goingRecords = going?.records ?? [];
	const interestedRecords = interested?.records ?? [];
	const goingProfiles = going?.profiles ?? [];
	const interestedProfiles = interested?.profiles ?? [];

	const seenGoing = new Set<string>();
	const uniqueGoing = goingRecords.filter((r) => {
		if (seenGoing.has(r.did)) return false;
		seenGoing.add(r.did);
		return true;
	});
	const seenInterested = new Set<string>();
	const uniqueInterested = interestedRecords.filter((r) => {
		if (seenInterested.has(r.did)) return false;
		seenInterested.add(r.did);
		return true;
	});

	return {
		going: uniqueGoing.map((r) => buildAttendee(r.did, 'going', goingProfiles)),
		interested: uniqueInterested.map((r) => buildAttendee(r.did, 'interested', interestedProfiles)),
		goingCount: uniqueGoing.length,
		interestedCount: uniqueInterested.length
	};
}

export async function fetchAtmoViewerRsvp({
	eventUri,
	actor
}: {
	eventUri: string;
	actor: string;
}): Promise<AtmoRsvpRecord | null> {
	const data = await appviewGet<AtmoListRsvpsResponse>('rsvp.atmo.rsvp.listRecords', {
		actor,
		subjectUri: eventUri,
		limit: 1
	});
	return data?.records?.[0] ?? null;
}

export async function fetchAtmoProfile(actor: string): Promise<AtmoProfileEntry | null> {
	const data = await appviewGet<{ profiles?: AtmoProfileEntry[] }>('rsvp.atmo.getProfile', {
		actor
	});
	return data?.profiles?.[0] ?? null;
}

export interface VodRecord {
	atUri: string;
	playlistUrl: string;
}

const VOD_PLAYBACK_BASE =
	'https://vod-beta.stream.place/xrpc/place.stream.playback.getVideoPlaylist';

export function vodFromAtUri(atUri: string): VodRecord {
	return {
		atUri,
		playlistUrl: `${VOD_PLAYBACK_BASE}?uri=${encodeURIComponent(atUri)}`
	};
}

export { getProfileBlobUrl };
