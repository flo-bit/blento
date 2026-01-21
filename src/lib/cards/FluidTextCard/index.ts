import type { CardDefinition } from '../types';
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
	sidebarButtonText: 'Fluid Text',
	defaultColor: 'transparent',
	allowSetColor: false,
	minW: 2
} as CardDefinition & { type: 'fluid-text' };
