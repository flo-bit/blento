import type { CardDefinition } from '../types';
import CreateFluidTextCardModal from './CreateFluidTextCardModal.svelte';
import FluidTextCard from './FluidTextCard.svelte';
import FluidTextCardSettings from './FluidTextCardSettings.svelte';

export const FluidTextCardDefinition = {
	type: 'fluid-text',
	contentComponent: FluidTextCard,
	createNew: (card) => {
		card.cardType = 'fluid-text';
		card.cardData = {
			text: '',
			fontWeight: '900',
			fontFamily: 'Arial',
			fontSize: 0.33
		};
		card.w = 4;
		card.h = 2;
		card.mobileW = 4;
		card.mobileH = 2;
	},
	creationModalComponent: CreateFluidTextCardModal,
	settingsComponent: FluidTextCardSettings,
	sidebarButtonText: 'Fluid Text',
	defaultColor: 'transparent',
	minW: 2,
	minH: 2
} as CardDefinition & { type: 'fluid-text' };
