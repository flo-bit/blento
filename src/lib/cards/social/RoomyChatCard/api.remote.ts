import { query, getRequestEvent } from '$app/server';
import { createCache } from '$lib/helpers/cache';
import type { RoomyMessage, RoomyRoomData } from './types';

const API_URL = 'https://api.roomy.space/xrpc';

// How many recent messages to fetch/render.
const MESSAGE_LIMIT = 50;

/**
 * Resolve a Roomy image reference to a usable URL.
 * `atblob://{did}/{cid}` refs are served via the Bluesky CDN; everything else
 * is assumed to already be a normal URL.
 */
function cdnImageUrl(
	uri: string | undefined,
	opts?: { size: 'full' | 'thumbnail' }
): string | undefined {
	if (!uri) return undefined;
	if (uri.startsWith('atblob://')) {
		const split = uri.split('atblob://')[1]?.split('/');
		if (!split || split.length !== 2) return undefined;
		const [did, cid] = split;
		const variant = opts?.size === 'thumbnail' ? 'feed_thumbnail' : 'feed_fullsize';
		return `https://cdn.bsky.app/img/${variant}/plain/${did}/${cid}`;
	}
	return uri;
}

/**
 * Fetch the latest messages (and room name) for a Roomy room.
 * Readonly: we only render what `getMessages` / `getMetadata` return.
 */
export const fetchRoomyRoom = query(
	'unchecked',
	async ({ roomId }: { roomId: string }): Promise<RoomyRoomData | undefined> => {
		const { platform } = getRequestEvent();
		const cache = createCache(platform);

		const cached = await cache?.getJSON<RoomyRoomData>('roomy', roomId);
		if (cached) return cached;

		const [messagesRes, metaRes] = await Promise.all([
			fetch(
				`${API_URL}/space.roomy.room.getMessages?roomId=${encodeURIComponent(roomId)}&limit=${MESSAGE_LIMIT}`
			),
			fetch(`${API_URL}/space.roomy.room.getMetadata?roomId=${encodeURIComponent(roomId)}`)
		]);

		if (!messagesRes.ok) return undefined;

		const messagesData = await messagesRes.json();
		const meta = metaRes.ok ? await metaRes.json() : undefined;

		const messages: RoomyMessage[] = (messagesData?.messages ?? []).map(
			(m: Record<string, unknown>) => ({
				id: String(m.id),
				content: String(m.content ?? ''),
				authorDid: String(m.authorDid ?? ''),
				authorName: String(m.authorName ?? m.authorHandle ?? 'unknown'),
				authorHandle: String(m.authorHandle ?? ''),
				authorAvatar: cdnImageUrl(m.authorAvatar ? String(m.authorAvatar) : undefined, {
					size: 'thumbnail'
				}),
				timestamp: String(m.timestamp ?? ''),
				reactions: Array.isArray(m.reactions)
					? (m.reactions as RoomyMessage['reactions']).map((r) => ({
							emoji: String(r.emoji),
							dids: Array.isArray(r.dids) ? r.dids.map(String) : []
						}))
					: []
			})
		);

		const data: RoomyRoomData = {
			roomId,
			spaceId: meta?.spaceId ? String(meta.spaceId) : undefined,
			name: meta?.name ? String(meta.name) : undefined,
			messages
		};

		await cache?.putJSON('roomy', roomId, data);
		return data;
	}
);
