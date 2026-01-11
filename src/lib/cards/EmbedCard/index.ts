import type { CardDefinition } from '../types';
import CreateEmbedCardModal from './CreateEmbedCardModal.svelte';
import EmbedCard from './EmbedCard.svelte';
import SidebarItemEmbedCard from './SidebarItemEmbedCard.svelte';

export const EmbedCardDefinition = {
	type: 'embed',
	contentComponent: EmbedCard,
	creationModalComponent: CreateEmbedCardModal,
	sidebarComponent: SidebarItemEmbedCard,
	createNew: (card) => {
		card.w = 4;
		card.h = 4;
		card.mobileH = 8;
		card.mobileW = 8;
	}
} as CardDefinition & { type: 'embed' };
