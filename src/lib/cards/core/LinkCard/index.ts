import { checkAndUploadImage, validateLink } from '$lib/helper';
import type { CardDefinition } from '../../types';
import CreateLinkCardModal from './CreateLinkCardModal.svelte';
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

	creationModalComponent: CreateLinkCardModal,

	name: 'Link',
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
	urlHandlerPriority: 0,

	keywords: ['url', 'website', 'href', 'webpage'],
	groups: ['Core'],

	icon: `<svg
xmlns="http://www.w3.org/2000/svg"
fill="none"
viewBox="-2 -2 28 28"
stroke-width="2"
stroke="currentColor"
class="size-4"
>
<path
	stroke-linecap="round"
	stroke-linejoin="round"
	d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
/>
</svg>`
} as CardDefinition & { type: 'link' };
