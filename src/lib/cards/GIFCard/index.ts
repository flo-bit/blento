import type { CardDefinition } from '../types';
import CreateGifCardModal from './CreateGifCardModal.svelte';
import EditingGifCard from './EditingGifCard.svelte';
import GifCard from './GifCard.svelte';
import GifCardSettings from './GifCardSettings.svelte';

export const GifCardDefinition = {
	type: 'gif',
	contentComponent: GifCard,
	editingContentComponent: EditingGifCard,
	creationModalComponent: CreateGifCardModal,
	createNew: (card) => {
		card.cardType = 'gif';
		card.cardData = {
			url: '',
			alt: ''
		};
		card.w = 2;
		card.h = 2;
		card.mobileW = 4;
		card.mobileH = 4;
	},
	settingsComponent: GifCardSettings,
	sidebarButtonText: 'GIF',
	defaultColor: 'transparent',
	allowSetColor: false,
	minW: 1,
	minH: 1,
	canHaveLabel: true,
	onUrlHandler: (url, item) => {
		// Match Giphy page URLs: https://giphy.com/gifs/name-ID or https://giphy.com/gifs/ID
		const pageMatch = url.match(/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)(?:\?|$)/);
		if (pageMatch) {
			item.cardData.url = `https://media.giphy.com/media/${pageMatch[1]}/giphy.mp4`;
			return item;
		}

		// Match Giphy media URLs: https://media.giphy.com/media/ID/giphy.gif or .mp4
		const mediaMatch = url.match(/media\.giphy\.com\/media\/([a-zA-Z0-9]+)\//);
		if (mediaMatch) {
			item.cardData.url = `https://media.giphy.com/media/${mediaMatch[1]}/giphy.mp4`;
			return item;
		}

		return null;
	},
	urlHandlerPriority: 5,
	name: 'GIF'
} as CardDefinition & { type: 'gif' };
