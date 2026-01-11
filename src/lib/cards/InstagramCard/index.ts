import type { CardDefinition } from '../types';
import CreateInstagramCardModal from './CreateInstagramCardModal.svelte';
import InstagramCard from './InstagramCard.svelte';
import SidebarItemInstagramCard from './SidebarItemInstagramCard.svelte';

export const InstagramCardDefinition = {
	type: 'instagram',
	contentComponent: InstagramCard,
	createNew: (card) => {
		card.cardType = 'instagram';
		card.cardData = {
			username: ''
		};
	},
	creationModalComponent: CreateInstagramCardModal,
	sidebarComponent: SidebarItemInstagramCard
} as CardDefinition & { type: 'instagram' };
