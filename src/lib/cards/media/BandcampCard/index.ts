import type { CardDefinition } from '../../types';
import BandcampCard from './BandcampCard.svelte';
import CreateBandcampCardModal from './CreateBandcampCardModal.svelte';
import { isBandcampUrl } from './shared';

const cardType = 'bandcamp-embed';

export const BandcampCardDefinition = {
	type: cardType,
	contentComponent: BandcampCard,
	creationModalComponent: CreateBandcampCardModal,
	createNew: (item) => {
		item.cardType = cardType;
		item.cardData = {};
		item.w = 4;
		item.mobileW = 8;
		item.h = 5;
		item.mobileH = 10;
	},

	onUrlHandler: (url, item) => {
		if (!isBandcampUrl(url)) return null;

		item.cardData.href = url;

		item.w = 4;
		item.mobileW = 8;
		item.h = 5;
		item.mobileH = 10;

		return item;
	},

	urlHandlerPriority: 2,

	canChange: (item) => isBandcampUrl(item.cardData?.href),
	change: (item) => item,

	name: 'Bandcamp Embed',
	canResize: true,
	minW: 3,
	minH: 4,

	keywords: ['music', 'album', 'track', 'bandcamp', 'audio', 'artist'],
	groups: ['Media'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4"><path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z"/></svg>`
} as CardDefinition & { type: typeof cardType };
