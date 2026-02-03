import { COLUMNS } from '$lib';
import type { CardDefinition } from '../../types';
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
	minW: COLUMNS,
	maxH: 1,
	canResize: false,
	settingsComponent: SectionCardSettings,

	name: 'Heading',
	keywords: ['title', 'section', 'header', 'divider'],
	groups: ['Core'],

	icon: `<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class="size-4"
	><path d="M6 12h12" /><path d="M6 20V4" /><path d="M18 20V4" /></svg
>`
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
