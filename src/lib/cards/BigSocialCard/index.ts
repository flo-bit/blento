import type { CardDefinition } from '../types';
import BigSocialCard from './BigSocialCard.svelte';
import CreateBigSocialCardModal from './CreateBigSocialCardModal.svelte';
import SidebarItemBigSocialCard from './SidebarItemBigSocialCard.svelte';

export const BigSocialCardDefinition = {
	type: 'bigsocial',
	contentComponent: BigSocialCard,
	creationModalComponent: CreateBigSocialCardModal,
	sidebarComponent: SidebarItemBigSocialCard,
	createNew: (card) => {
		card.cardType = 'bigsocial';
		card.cardData = {
			href: '',
			platform: ''
		};
		card.w = 2;
		card.h = 2;
		card.mobileW = 2;
		card.mobileH = 2;
	},
	allowSetColor: true,
	defaultColor: 'accent',
	minW: 1,
	minH: 1
} as CardDefinition & { type: 'bigsocial' };
