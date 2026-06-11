import { error } from '@sveltejs/kit';
import { getActor } from '$lib/helpers/actor';
import {
	fetchAtmoEvent,
	fetchAtmoEventAttendees,
	fetchAtmoProfile,
	fetchAtmoViewerRsvp,
	getHostProfile,
	getProfileBlobUrl,
	getRsvpStatus,
	vodFromAtUri
} from '$lib/events/atmo-appview';
import type { ActorIdentifier } from '@atcute/lexicons';

export async function load({ params, request, platform, locals, url }) {
	if (!params.rkey) error(404, 'Event URL missing rkey');

	const did = await getActor({
		request,
		paramActor: params.actor as ActorIdentifier | undefined,
		platform
	});
	if (!did) error(404, 'Could not resolve actor');

	const event = await fetchAtmoEvent({ did, rkey: params.rkey });
	if (!event) error(404, 'Event not found');

	const additional = event.flat.additionalData as Record<string, unknown> | undefined;
	const isAtmosphereconf = !!additional?.isAtmosphereconf;
	const speakers = (additional?.speakers as Array<{ id: string; name: string }> | undefined) ?? [];
	const vodAtUri = additional?.vodAtUri as string | undefined;
	const vod = vodAtUri ? vodFromAtUri(vodAtUri) : null;

	const viewerDid = locals.did ?? null;

	const [attendees, viewerRsvpRecord, parentEvent, ...speakerProfiles] = await Promise.all([
		fetchAtmoEventAttendees(event.flat.uri),
		viewerDid ? fetchAtmoViewerRsvp({ eventUri: event.flat.uri, actor: viewerDid }) : null,
		isAtmosphereconf
			? fetchAtmoEvent({
					did: 'did:plc:lehcqqkwzcwvjvw66uthu5oq',
					rkey: '3lte3c7x43l2e'
				})
					.then((e) => e?.flat ?? null)
					.catch(() => null)
			: null,
		...speakers.map(async (s) => {
			if (!s.id) return { id: undefined, name: s.name, avatar: undefined, handle: undefined };
			try {
				const p = await fetchAtmoProfile(s.id);
				return {
					id: s.id,
					name: s.name,
					avatar: p?.value?.avatar ? getProfileBlobUrl(p.did, p.value.avatar) : undefined,
					handle: p?.handle || s.id
				};
			} catch {
				return { id: s.id, name: s.name, avatar: undefined, handle: s.id };
			}
		})
	]);

	return {
		ogImage: `https://atmo.rsvp/p/${params.actor || did}/e/${params.rkey}/og.png`,
		eventData: event.flat,
		actorDid: did,
		rkey: params.rkey,
		hostProfile: getHostProfile(did, event.raw.profiles) ?? null,
		attendees,
		viewerRsvpStatus: getRsvpStatus(viewerRsvpRecord?.value?.status),
		viewerRsvpRkey: viewerRsvpRecord?.rkey ?? null,
		parentEvent,
		vod,
		speakerProfiles: speakerProfiles as Array<{
			id?: string;
			name: string;
			avatar?: string;
			handle?: string;
		}>,
		shareUrl: url.href
	};
}
