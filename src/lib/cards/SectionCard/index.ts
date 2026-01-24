import { COLUMNS } from '$lib';
import type { CardDefinition } from '../types';
import EditingSectionCard from './EditingSectionCard.svelte';
import SectionCard from './SectionCard.svelte';
import SectionCardSettings from './SectionCardSettings.svelte';

export const SectionCardDefinition = {
	type: 'section',
	contentComponent: SectionCard,
	editingContentComponent: EditingSectionCard,
	createNew: (card) => {
		card.cardType = 'section';
		card.cardData = {
			text: 'hello world',
			verticalAlign: 'bottom',
			textSize: 1
		};

		card.h = 1;
		card.mobileH = 2;

		card.w = COLUMNS;
		card.mobileW = COLUMNS;
	},

	defaultColor: 'transparent',
	maxH: 1,
	canResize: false,
	settingsComponent: SectionCardSettings
} as CardDefinition & { type: 'section' };

export const textAlignClasses: Record<string, string> = {
	left: '',
	center: 'text-center justify-center',
	right: 'text-end justify-end'
};

export const verticalAlignClasses: Record<string, string> = {
	top: 'items-stretch',
	center: 'items-center-safe',
	bottom: 'items-end-safe'
};

export const textSizeClasses = ['text-lg', 'text-2xl', 'text-4xl', 'text-5xl'];
