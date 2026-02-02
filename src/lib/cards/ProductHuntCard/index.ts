import type { CardDefinition } from '../types';
import CreateProductHuntCardModal from './CreateProductHuntCardModal.svelte';
import ProductHuntCard from './ProductHuntCard.svelte';

const cardType = 'producthunt';

export const ProductHuntCardDefinition = {
	type: cardType,
	contentComponent: ProductHuntCard,
	creationModalComponent: CreateProductHuntCardModal,
	createNew: (item) => {
		item.cardType = cardType;
		item.cardData = {};
		item.w = 4;
		item.h = 2;
		item.mobileW = 8;
		item.mobileH = 2;
	},

	defaultColor: 'transparent',

	allowSetColor: false,

	minH: 1,

	name: 'Product Hunt',
	keywords: ['producthunt', 'product', 'launch', 'badge'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4"><path d="M13.6 12h-3.2V8h3.2a2 2 0 1 1 0 4ZM12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0Zm1.6 14.4h-3.2V18H8V6h5.6a4.4 4.4 0 0 1 0 8.8h0v-.4Z"/></svg>`
} as CardDefinition & { type: typeof cardType };
