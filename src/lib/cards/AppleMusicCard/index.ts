import type { CardDefinition } from '../types';
import CreateAppleMusicCardModal from './CreateAppleMusicCardModal.svelte';
import AppleMusicCard from './AppleMusicCard.svelte';

const cardType = 'apple-music-embed';

export const AppleMusicCardDefinition = {
	type: cardType,
	contentComponent: AppleMusicCard,
	creationModalComponent: CreateAppleMusicCardModal,
	createNew: (item) => {
		item.cardType = cardType;
		item.cardData = {};
		item.w = 4;
		item.mobileW = 8;
		item.h = 5;
		item.mobileH = 10;
	},

	onUrlHandler: (url, item) => {
		const match = matchAppleMusicUrl(url);
		if (!match) return null;

		item.cardData.appleMusicType = match.type;
		item.cardData.appleMusicId = match.id;
		item.cardData.appleMusicStorefront = match.storefront;
		item.cardData.href = url;

		item.w = 4;
		item.mobileW = 8;
		item.h = 5;
		item.mobileH = 10;

		return item;
	},

	urlHandlerPriority: 2,

	name: 'Apple Music Embed',
	canResize: true,
	minW: 4,
	minH: 5,

	keywords: ['music', 'apple', 'playlist', 'album'],
	groups: ['Media'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.8-.6-1.965-1.483-.18-.965.46-1.97 1.553-2.142.238-.037.48-.065.72-.082.39-.03.78-.056 1.168-.1.207-.02.357-.127.404-.334a1.14 1.14 0 00.025-.26V9.97a.48.48 0 00-.357-.47c-.107-.033-.218-.06-.33-.073-.565-.065-1.13-.118-1.696-.18l-3.535-.38c-.043-.004-.088-.005-.13 0a.334.334 0 00-.32.334c-.003.06 0 .12 0 .18v7.63c0 .4-.046.793-.216 1.16-.293.635-.792 1.03-1.466 1.205-.32.082-.647.136-.978.152-.93.043-1.764-.585-1.95-1.443-.2-.924.39-1.893 1.397-2.1.36-.073.724-.118 1.088-.158.274-.03.55-.06.82-.105.164-.027.3-.1.367-.27a.77.77 0 00.048-.268V7.762c0-.282.07-.53.275-.735a1.09 1.09 0 01.49-.282c.333-.093.674-.143 1.012-.18l3.384-.38c.56-.063 1.12-.123 1.68-.187.321-.037.642-.063.96-.04.37.03.658.2.86.518.088.138.135.292.148.453.016.224.02.448.02.672v2.533z"/></svg>`
} as CardDefinition & { type: typeof cardType };

// Match Apple Music album and playlist URLs
// Examples:
// https://music.apple.com/us/album/midnights/1649434004
// https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb
function matchAppleMusicUrl(
	url: string | undefined
): { type: 'album' | 'playlist'; id: string; storefront: string } | null {
	if (!url) return null;

	const pattern = /music\.apple\.com\/([a-z]{2})\/(album|playlist)\/[^/]+\/([a-zA-Z0-9.]+)/;
	const match = url.match(pattern);

	if (match) {
		return {
			storefront: match[1],
			type: match[2] as 'album' | 'playlist',
			id: match[3]
		};
	}

	return null;
}
