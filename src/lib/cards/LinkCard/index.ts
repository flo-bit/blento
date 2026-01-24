import { checkAndUploadImage, validateLink } from '$lib/helper';
import type { CardDefinition } from '../types';
import EditingLinkCard from './EditingLinkCard.svelte';
import LinkCard from './LinkCard.svelte';
import LinkCardSettings from './LinkCardSettings.svelte';

export const LinkCardDefinition = {
	type: 'link',
	contentComponent: LinkCard,
	editingContentComponent: EditingLinkCard,
	createNew: (card) => {
		card.cardData.hasFetched = false;
	},
	settingsComponent: LinkCardSettings,

	name: 'Link Card',
	canChange: (item) => Boolean(validateLink(item.cardData?.href)),
	change: (item) => {
		const href = validateLink(item.cardData?.href);
		if (!href) return item;

		item.cardData = {
			...item.cardData,
			hasFetched: false
		};
		return item;
	},
	onUrlHandler: (url, item) => {
		item.cardData.href = url;
		item.cardData.domain = new URL(url).hostname;
		item.cardData.hasFetched = false;
		return item;
	},
	upload: async (item) => {
		await checkAndUploadImage(item.cardData, 'image');
		await checkAndUploadImage(item.cardData, 'favicon');
		return item;
	},
	urlHandlerPriority: 0
} as CardDefinition & { type: 'link' };
