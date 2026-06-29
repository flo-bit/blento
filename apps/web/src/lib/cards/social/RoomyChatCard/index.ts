import type { CardDefinition } from '../../types';
import CreateRoomyChatCardModal from './CreateRoomyChatCardModal.svelte';
import RoomyChatCard from './RoomyChatCard.svelte';
import SourceSettings from '../../_settings/SourceSettings.svelte';
import { fetchRoomyRoom } from './api.remote';
import type { RoomyRoomData } from './types';

export type { RoomyLoadedData } from './types';

async function loadRooms(items: { cardData: Record<string, unknown> }[]) {
	const rooms: Record<string, RoomyRoomData> = {};
	const roomIds = [
		...new Set(
			items
				.map((item) => item.cardData.roomId as string | undefined)
				.filter((id): id is string => !!id)
		)
	];
	await Promise.all(
		roomIds.map(async (roomId) => {
			try {
				const data = await fetchRoomyRoom({ roomId });
				if (data) rooms[roomId] = data;
			} catch (error) {
				console.error('Failed to fetch roomy room:', error);
			}
		})
	);
	return rooms;
}

export const RoomyChatCardDefinition = {
	type: 'roomy-chat',
	contentComponent: RoomyChatCard,
	creationModalComponent: CreateRoomyChatCardModal,
	settingsComponent: SourceSettings,
	source: {
		label: 'Room URL',
		placeholder: 'https://lite.roomy.space/did:plc:.../01...',
		errorMessage: "That doesn't look like a Roomy room link"
	},

	// fetchRoomyRoom does its own KV caching (`roomy` namespace), so the
	// SWR layer (cacheLoadData) isn't needed here.
	loadData: loadRooms,
	loadDataServer: loadRooms,

	createNew: (card) => {
		card.cardData = {};
		card.w = 4;
		card.h = 5;
		card.mobileW = 8;
		card.mobileH = 7;
	},

	onUrlHandler: (url, item) => {
		const parsed = parseRoomyUrl(url);
		if (!parsed) return null;

		item.cardData.href = url;
		item.cardData.roomId = parsed.roomId;
		if (parsed.spaceId) item.cardData.spaceId = parsed.spaceId;

		item.w = 4;
		item.h = 5;
		item.mobileW = 8;
		item.mobileH = 7;
		return item;
	},
	urlHandlerPriority: 5,

	canChange: (item) => Boolean(parseRoomyUrl(item.cardData.href)),
	change: (item) => {
		const parsed = parseRoomyUrl(item.cardData.href);
		if (parsed) {
			item.cardData.roomId = parsed.roomId;
			if (parsed.spaceId) item.cardData.spaceId = parsed.spaceId;
		}
		return item;
	},

	minW: 2,
	minH: 2,

	name: 'Roomy Chat',
	keywords: ['chat', 'roomy', 'messages', 'channel', 'community'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
} as CardDefinition & { type: 'roomy-chat' };

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

/**
 * Parse a Roomy room link into { roomId, spaceId? }.
 * Accepts:
 *   https://lite.roomy.space/{spaceId}/{roomId}
 *   https://lite.roomy.space/{spaceId}/{roomId}?parent=...
 * The roomId is the trailing ULID segment.
 */
export function parseRoomyUrl(
	url: string | undefined
): { roomId: string; spaceId?: string } | undefined {
	if (!url) return;
	const trimmed = url.trim();

	try {
		const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
		if (!/^(lite\.|www\.)?roomy\.space$/.test(parsed.hostname)) return;

		const segments = parsed.pathname.split('/').filter(Boolean);
		// /{spaceId}/{roomId}
		if (segments.length >= 2 && ULID_RE.test(segments[1])) {
			return { spaceId: segments[0], roomId: segments[1] };
		}
		// /{roomId}
		if (segments.length === 1 && ULID_RE.test(segments[0])) {
			return { roomId: segments[0] };
		}
		return;
	} catch {
		return;
	}
}
