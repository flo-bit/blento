import type { CardDefinition } from '../../types';
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

	settingsComponent: TextCardSettings,

	name: 'Text',

	keywords: ['paragraph', 'note', 'write', 'content', 'description', 'bio'],
	groups: ['Core'],

	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-4"
					><path
						fill="none"
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="m15 16l2.536-7.328a1.02 1.02 1 0 1 1.928 0L22 16m-6.303-2h5.606M2 16l4.039-9.69a.5.5 0 0 1 .923 0L11 16m-7.696-3h6.392"
					/></svg
				>`
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
