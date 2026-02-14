import { getCDNImageBlobUrl, resolveHandle } from '$lib/atproto/methods.js';
import { env as publicEnv } from '$env/dynamic/public';

import type { ActorIdentifier } from '@atcute/lexicons';
import { isHandle } from '@atcute/lexicons/syntax';
import type { EventData } from '$lib/cards/social/EventCard';
import { ImageResponse } from '@ethercorps/sveltekit-og';
import { error } from '@sveltejs/kit';
import EventOgImage from './EventOgImage.svelte';
import { getActor } from '$lib/actor';

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
	const month = date.toLocaleDateString('en-US', { month: 'long' });
	const day = date.getDate();
	return `${weekday}, ${month} ${day}`;
}

export async function GET({ params, platform, request }) {
	const { rkey } = params;

	const did = await getActor({ request, paramActor: params.actor, platform });

	if (!did || !rkey) {
		throw error(404, 'Event not found');
	}

	let eventData: EventData;

	try {
		const eventResponse = await fetch(
			`https://smokesignal.events/xrpc/community.lexicon.calendar.GetEvent?repository=${encodeURIComponent(did)}&record_key=${encodeURIComponent(rkey)}`
		);

		if (!eventResponse.ok) {
			throw error(404, 'Event not found');
		}

		eventData = await eventResponse.json();
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Event not found');
	}

	const dateStr = formatDate(eventData.startsAt);

	let thumbnailUrl: string | null = null;
	if (eventData.media && eventData.media.length > 0) {
		const media = eventData.media.find((m) => m.role === 'thumbnail');
		if (media?.content) {
			thumbnailUrl = getCDNImageBlobUrl({ did, blob: media.content, type: 'jpeg' }) ?? null;
		}
	}

	return new ImageResponse(
		EventOgImage,
		{ width: 1200, height: 630, debug: false },
		{
			name: eventData.name,
			dateStr,
			thumbnailUrl,
			rkey
		}
	);
}
