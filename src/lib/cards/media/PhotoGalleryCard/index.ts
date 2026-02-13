import type { CardDefinition } from '../../types';
import PhotoGalleryCard from './PhotoGalleryCard.svelte';
import CreateGrainGalleryCardModal from './CreateGrainGalleryCardModal.svelte';
import { parseGrainGalleryUrl, loadGrainGalleryData } from './helpers';

export { parseGrainGalleryUrl, loadGrainGalleryData };

const cardType = 'grain-gallery';

export const PhotoGalleryCardDefinition = {
	type: cardType,
	contentComponent: PhotoGalleryCard,
	creationModalComponent: CreateGrainGalleryCardModal,
	createNew: (card) => {
		card.cardData = {};
		card.w = 4;
		card.mobileW = 8;
		card.h = 3;
		card.mobileH = 6;
	},

	onUrlHandler: (url, item) => {
		const parsed = parseGrainGalleryUrl(url);
		if (!parsed) return null;

		// Store with handle — loadData will resolve to DID
		item.cardData.galleryUri = `at://${parsed.handle}/social.grain.gallery/${parsed.rkey}`;

		item.w = 4;
		item.mobileW = 8;
		item.h = 3;
		item.mobileH = 6;

		return item;
	},

	urlHandlerPriority: 2,

	loadData: async (items) => loadGrainGalleryData(items),

	canHaveLabel: true,

	name: 'Grain Gallery',
	keywords: ['grain', 'gallery', 'album', 'photos', 'slideshow', 'images', 'carousel'],
	groups: ['Media'],
	minW: 4,
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21ZM16.5 8.25a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Z" /></svg>`
} as CardDefinition & { type: typeof cardType };
