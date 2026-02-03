import type { CardDefinition } from '../../types';
import CreateSpotifyCardModal from './CreateSpotifyCardModal.svelte';
import SpotifyCard from './SpotifyCard.svelte';

const cardType = 'spotify-list-embed';

export const SpotifyCardDefinition = {
	type: cardType,
	contentComponent: SpotifyCard,
	creationModalComponent: CreateSpotifyCardModal,
	createNew: (item) => {
		item.cardType = cardType;
		item.cardData = {};
		item.w = 4;
		item.mobileW = 8;
		item.h = 5;
		item.mobileH = 10;
	},

	onUrlHandler: (url, item) => {
		const match = matchSpotifyUrl(url);
		if (!match) return null;

		item.cardData.spotifyType = match.type;
		item.cardData.spotifyId = match.id;
		item.cardData.href = url;

		item.w = 4;
		item.mobileW = 8;
		item.h = 5;
		item.mobileH = 10;

		return item;
	},

	urlHandlerPriority: 2,

	name: 'Spotify Embed',
	canResize: true,
	minW: 4,
	minH: 5,

	keywords: ['music', 'song', 'playlist', 'album', 'podcast'],
	groups: ['Media'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>`
} as CardDefinition & { type: typeof cardType };

// Match Spotify album and playlist URLs
// Examples:
// https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3
// https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
function matchSpotifyUrl(
	url: string | undefined
): { type: 'album' | 'playlist'; id: string } | null {
	if (!url) return null;

	const pattern = /open\.spotify\.com\/(album|playlist)\/([a-zA-Z0-9]+)/;
	const match = url.match(pattern);

	if (match) {
		return {
			type: match[1] as 'album' | 'playlist',
			id: match[2]
		};
	}

	return null;
}
