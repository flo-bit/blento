import type { CardDefinition } from '../../types';
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

	// canChange: (item) => Boolean(item.cardData.href),

	// change: (item) => {
	// 	return item;
	// },
	name: 'Embed',
	keywords: ['iframe', 'widget', 'html', 'website'],
	groups: ['Media'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>`
} as CardDefinition & { type: 'embed' };
