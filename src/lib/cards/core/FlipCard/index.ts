import type { CardDefinition } from '../../types';
import EditingFlipCard from './EditingFlipCard.svelte';
import FlipCard from './FlipCard.svelte';
import FlipCardSettings from './FlipCardSettings.svelte';

export const FlipCardDefinition = {
	type: 'flipCard',
	contentComponent: FlipCard,
	editingContentComponent: EditingFlipCard,
	createNew: (card) => {
		card.cardType = 'flipCard';
		card.cardData = {
			frontText: 'Front',
			backText: 'Back'
		};
	},

	settingsComponent: FlipCardSettings,

	defaultColor: 'transparent',

	name: 'Flip Card',

	keywords: ['flip', 'flashcard', 'two-sided', 'reveal'],
	groups: ['Core'],

	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-4"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 20V4m-4 8h8" /></svg>`
} as CardDefinition & { type: 'flipCard' };
