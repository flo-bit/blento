import type { CardDefinition } from '../types';
import EditingTextCard from './EditingTextCard.svelte';
import TextCard from './TextCard.svelte';
import TextCardSettings from './TextCardSettings.svelte';

export const TextCardDefinition = {
	type: 'text',
	contentComponent: TextCard,
	editingContentComponent: EditingTextCard,
	createNew: (card) => {
		card.cardType = 'text';
		card.cardData = {
			text: 'hello world'
		};
	},

	settingsComponent: TextCardSettings
} as CardDefinition & { type: 'text' };

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

export const textSizeClasses = [
	'text-lg',
	'text-xl',
	'text-2xl',
	'text-3xl',
	'text-4xl',
	'text-5xl'
];
