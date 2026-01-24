import { checkAndUploadImage } from '$lib/helper';
import type { CardDefinition } from '../types';
import ImageCard from './ImageCard.svelte';
import ImageCardSettings from './ImageCardSettings.svelte';

// Common image extensions
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|bmp|ico|avif|tiff?)(\?.*)?$/i;

export const ImageCardDefinition = {
	type: 'image',
	contentComponent: ImageCard,
	createNew: (card) => {
		card.cardType = 'image';
		card.cardData = {
			image: '',
			alt: '',
			href: ''
		};
	},
	upload: async (item) => {
		await checkAndUploadImage(item.cardData, 'image');
		return item;
	},
	settingsComponent: ImageCardSettings,

	canChange: (item) => Boolean(item.cardData.image),

	change: (item) => {
		return item;
	},

	onUrlHandler: (url, item) => {
		// Check if URL points to an image
		if (IMAGE_EXTENSIONS.test(url)) {
			item.cardType = 'image';
			item.cardData.image = url;
			item.cardData.alt = '';
			item.cardData.href = '';
			return item;
		}
		return null;
	},
	urlHandlerPriority: 3,

	name: 'Image Card',

	canHaveLabel: true
} as CardDefinition & { type: 'image' };
