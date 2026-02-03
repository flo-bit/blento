import { checkAndUploadImage } from '$lib/helper';
import type { CardDefinition } from '../../types';
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

	name: 'Image',

	canHaveLabel: true,

	keywords: ['photo', 'picture', 'upload', 'png', 'jpg'],
	groups: ['Core'],

	icon: `<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="size-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
					/>
				</svg>`
} as CardDefinition & { type: 'image' };
