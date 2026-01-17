import { uploadBlob } from '$lib/oauth/utils';
import type { CardDefinition } from '../types';
import ImageCard from './ImageCard.svelte';

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
		if (item.cardData.blob) {
			item.cardData.image = await uploadBlob(item.cardData.blob);

			delete item.cardData.blob;
		}

		if (item.cardData.objectUrl) {
			URL.revokeObjectURL(item.cardData.objectUrl);

			delete item.cardData.objectUrl;
		}

		return item;
	}
} as CardDefinition & { type: 'image' };
