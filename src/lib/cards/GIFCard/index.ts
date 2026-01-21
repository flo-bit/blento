import { uploadBlob } from '$lib/oauth/utils';
import type { CardDefinition } from '../types';
import EditingGifCard from './EditingGifCard.svelte';
import GifCard from './GifCard.svelte';
import GifCardSettings from './GifCardSettings.svelte';

export const GifCardDefinition = {
	type: 'gif',
	contentComponent: GifCard,
	editingContentComponent: EditingGifCard,
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
	settingsComponent: GifCardSettings,
	sidebarButtonText: 'GIF',
	defaultColor: 'transparent',
	allowSetColor: false,
	minW: 1,
	minH: 1,
	onUrlHandler: (url, item) => {
		const gifUrlPatterns = [
			/\.gif(\?.*)?$/i,
			/giphy\.com\/gifs\//i,
			/media\.giphy\.com/i,
			/tenor\.com/i,
			/imgur\.com.*\.gif/i
		];

		if (gifUrlPatterns.some((pattern) => pattern.test(url))) {
			// Convert Giphy page URLs to direct media URLs
			const giphyMatch = url.match(/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)(?:\?|$)/);
			if (giphyMatch) {
				item.cardData.url = `https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`;
			} else {
				item.cardData.url = url;
			}
			return item;
		}
		return null;
	},
	urlHandlerPriority: 5
} as CardDefinition & { type: 'gif' };
