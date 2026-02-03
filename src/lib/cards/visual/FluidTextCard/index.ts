import type { CardDefinition } from '../../types';
import CreateFluidTextCardModal from './CreateFluidTextCardModal.svelte';
import EditingFluidTextCard from './EditingFluidTextCard.svelte';
import FluidTextCard from './FluidTextCard.svelte';
import FluidTextCardSettings from './FluidTextCardSettings.svelte';

export const FluidTextCardDefinition = {
	type: 'fluid-text',
	contentComponent: FluidTextCard,
	editingContentComponent: EditingFluidTextCard,
	createNew: (card) => {
		card.cardType = 'fluid-text';
		card.cardData = {
			text: ''
		};
		card.w = 8;
		card.h = 3;
		card.mobileW = 8;
		card.mobileH = 4;
	},
	creationModalComponent: CreateFluidTextCardModal,
	settingsComponent: FluidTextCardSettings,
	defaultColor: 'transparent',
	allowSetColor: true,
	minW: 2,

	keywords: ['animated', 'big text', 'headline', 'display'],
	groups: ['Visual'],
	name: 'Fluid Text',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>`
} as CardDefinition & { type: 'fluid-text' };
