import type { CardDefinition } from '../types';
import CreateEmbedCardModal from './CreateEmbedCardModal.svelte';
import EmbedCard from './EmbedCard.svelte';

export const EmbedCardDefinition = {
	type: 'embed',
	contentComponent: EmbedCard,
	creationModalComponent: CreateEmbedCardModal,

	createNew: (card) => {
		card.w = 4;
		card.h = 4;
		card.mobileH = 8;
		card.mobileW = 8;
	},

	canChange: (item) => Boolean(item.cardData.href && !item.cardData.href.startsWith('mailto:')),

	change: (item) => {
		return item;
	},
	name: 'Embed Card'
} as CardDefinition & { type: 'embed' };
