import type { CardDefinition } from '../../types';
import VideoCard from './VideoCard.svelte';
import CreateVideoCardModal from './CreateVideoCardModal.svelte';
import { getVideoAspectRatio, uploadVideoToBsky } from './upload';

export const VideoCardDefinition = {
	type: 'video',
	contentComponent: VideoCard,
	creationModalComponent: CreateVideoCardModal,
	createNew: (card) => {
		card.cardType = 'video';
		card.w = 4;
		card.h = 4;
		card.mobileW = 4;
		card.mobileH = 4;
		card.cardData = {
			video: null,
			href: ''
		};
	},

	// The drag-and-drop / file-picker path stashes a local File on the card
	// (cardData.blob) and defers the actual upload to save time. The "Add Video"
	// modal uploads eagerly and sets cardData.video itself, so this is a no-op there.
	upload: async (item) => {
		if (item.cardData.blob && !item.cardData.video) {
			const file: File = item.cardData.blob;
			const aspectRatio = await getVideoAspectRatio(file);
			const uploaded = await uploadVideoToBsky(file);
			item.cardData.video = uploaded.blob;
			if (aspectRatio) item.cardData.aspectRatio = aspectRatio;
		}

		// Drop the non-serializable local preview data before the record is saved.
		if (item.cardData.objectUrl) {
			URL.revokeObjectURL(item.cardData.objectUrl);
			delete item.cardData.objectUrl;
		}
		delete item.cardData.blob;

		return item;
	},

	name: 'Video',
	canHaveLabel: true,
	groups: ['Media'],
	keywords: ['video', 'mp4', 'clip', 'movie', 'upload'],

	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>`
} as CardDefinition & { type: 'video' };
