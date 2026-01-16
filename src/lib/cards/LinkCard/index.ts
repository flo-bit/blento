import type { CardDefinition } from '../types';
import EditingLinkCard from './EditingLinkCard.svelte';
import LinkCard from './LinkCard.svelte';
import LinkCardSettings from './LinkCardSettings.svelte';

export const LinkCardDefinition = {
	type: 'link',
	contentComponent: LinkCard,
	editingContentComponent: EditingLinkCard,
	createNew: (card) => {
		card.cardType = 'link';
	},
	settingsComponent: LinkCardSettings,
	onUrlHandler: (url, item) => {
		item.cardData.href = url;
		item.cardData.domain = new URL(url).hostname;
		item.cardData.hasFetched = false;
		return item;
	},
	urlHandlerPriority: 0
} as CardDefinition & { type: 'link' };
