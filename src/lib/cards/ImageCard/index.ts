import { uploadBlob } from '$lib/website/utils';
import type { CardDefinition } from '../types';
import CreateImageCardModal from './CreateImageCardModal.svelte';
import EditingImageCard from './EditingImageCard.svelte';
import ImageCard from './ImageCard.svelte';

export const ImageCardDefinition = {
	type: 'image',
	cardComponent: ImageCard,
	editingCardComponent: EditingImageCard,
	createNew: (card) => {
		card.cardType = 'image';
		card.cardData = {
			image: '',
			alt: '',
			href: ''
		};
		console.log('adding new card', card);
	},
	creationModalComponent: CreateImageCardModal,
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
