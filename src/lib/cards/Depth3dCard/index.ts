import { client } from '$lib/oauth';
import { uploadBlob } from '$lib/oauth/utils';
import type { CardDefinition } from '../types';
import Depth3dCard from './Depth3dCard.svelte';

export const Depth3dCardDefinition = {
	type: 'depth3d',
	contentComponent: Depth3dCard,

	createNew: (item) => {
		item.cardData.image = '';
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
	},

	sidebarButtonText: 'Depth 3D'
} as CardDefinition & { type: 'depth3d' };
