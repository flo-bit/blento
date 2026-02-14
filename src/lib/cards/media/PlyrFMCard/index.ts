import type { CardDefinition } from '../../types';
import CreatePlyrFMCardModal from './CreatePlyrFMCardModal.svelte';
import PlyrFMCard from './PlyrFMCard.svelte';

const musicIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V4.125A2.25 2.25 0 0 0 17.378 1.9l-7.056 2.018A2.25 2.25 0 0 0 8.69 6.08v7.353m0 0v2.929a2.25 2.25 0 0 1-1.244 2.013L6.07 19.21a1.803 1.803 0 1 1-1.758-3.14l1.88-1.003A2.25 2.25 0 0 0 7.378 13.1v-.065Z" /></svg>`;

// ── Track card (existing) ────────────────────────────────────────────

const trackType = 'plyr-fm';

export const PlyrFMCardDefinition = {
	type: trackType,
	contentComponent: PlyrFMCard,
	creationModalComponent: CreatePlyrFMCardModal,
	createNew: (item) => {
		item.cardType = trackType;
		item.cardData = {};
		item.w = 4;
		item.mobileW = 8;
		item.h = 2;
		item.mobileH = 4;
	},

	onUrlHandler: (url, item) => {
		const embedUrl = toPlyrFMTrackEmbedUrl(url);
		if (!embedUrl) return null;

		item.cardData.href = embedUrl;

		item.w = 4;
		item.mobileW = 8;
		item.h = 2;
		item.mobileH = 4;

		return item;
	},

	urlHandlerPriority: 2,

	name: 'Plyr.fm Song',
	canResize: true,
	minW: 2,
	minH: 2,

	keywords: ['music', 'song', 'plyr', 'plyrfm', 'audio', 'track'],
	groups: ['Media'],
	icon: musicIcon
} as CardDefinition & { type: typeof trackType };

// ── Collection card (playlists + albums) ─────────────────────────────

const collectionType = 'plyr-fm-collection';

export const PlyrFMCollectionCardDefinition = {
	type: collectionType,
	contentComponent: PlyrFMCard,
	creationModalComponent: CreatePlyrFMCardModal,
	createNew: (item) => {
		item.cardType = collectionType;
		item.cardData = {};
		item.w = 4;
		item.mobileW = 8;
		item.h = 5;
		item.mobileH = 10;
	},

	onUrlHandler: (url, item) => {
		const embedUrl = toPlyrFMCollectionEmbedUrl(url);
		if (!embedUrl) return null;

		item.cardData.href = embedUrl;

		item.w = 4;
		item.mobileW = 8;
		item.h = 5;
		item.mobileH = 10;

		return item;
	},

	// higher priority so collection URLs are matched before the track handler
	urlHandlerPriority: 3,

	name: 'Plyr.fm Playlist / Album',
	canResize: true,
	minW: 2,
	minH: 3,

	keywords: ['music', 'playlist', 'album', 'plyr', 'plyrfm', 'collection'],
	groups: ['Media'],
	icon: musicIcon
} as CardDefinition & { type: typeof collectionType };

// ── URL matching ─────────────────────────────────────────────────────

// Match plyr.fm track URLs
// https://plyr.fm/track/595
// https://plyr.fm/embed/track/56
export function toPlyrFMTrackEmbedUrl(url: string | undefined): string | null {
	if (!url) return null;

	const match = url.match(/plyr\.fm\/(embed\/)?track\/(\d+)/);
	if (!match) return null;

	return `https://plyr.fm/embed/track/${match[2]}`;
}

// Match plyr.fm playlist and album URLs
//
// Playlists:
//   https://plyr.fm/playlist/abc-def-123
//   https://plyr.fm/embed/playlist/abc-def-123
//
// Albums:
//   https://plyr.fm/u/handle/album/slug
//   https://plyr.fm/embed/album/handle/slug
export function toPlyrFMCollectionEmbedUrl(url: string | undefined): string | null {
	if (!url) return null;

	// Playlist: /playlist/{uuid} or /embed/playlist/{uuid}
	const playlistMatch = url.match(/plyr\.fm\/(embed\/)?playlist\/([a-f0-9-]+)/i);
	if (playlistMatch) {
		return `https://plyr.fm/embed/playlist/${playlistMatch[2]}`;
	}

	// Album: /u/{handle}/album/{slug} or /embed/album/{handle}/{slug}
	const albumEmbedMatch = url.match(/plyr\.fm\/embed\/album\/([^/?#]+)\/([^/?#]+)/);
	if (albumEmbedMatch) {
		return `https://plyr.fm/embed/album/${albumEmbedMatch[1]}/${albumEmbedMatch[2]}`;
	}
	const albumPageMatch = url.match(/plyr\.fm\/u\/([^/?#]+)\/album\/([^/?#]+)/);
	if (albumPageMatch) {
		return `https://plyr.fm/embed/album/${albumPageMatch[1]}/${albumPageMatch[2]}`;
	}

	return null;
}

// Accepts any plyr.fm URL (track, playlist, or album)
export function toPlyrFMEmbedUrl(url: string | undefined): string | null {
	return toPlyrFMTrackEmbedUrl(url) ?? toPlyrFMCollectionEmbedUrl(url);
}
