import type { CardDefinition } from '../types';
import CreateLinkCardModal from './CreateLinkCardModal.svelte';
import EditingLinkCard from './EditingLinkCard.svelte';
import LinkCard from './LinkCard.svelte';

export const LinkCardDefinition = {
	type: 'link',
	contentComponent: LinkCard,
	editingContentComponent: EditingLinkCard,
	createNew: (card) => {
		card.cardType = 'link';
		card.cardData = {
			href: 'https://'
		};
	},
	creationModalComponent: CreateLinkCardModal
} as CardDefinition & { type: 'link' };
