import type { CardDefinition } from '../../types';
import ButtondownCard from './ButtondownCard.svelte';
import ButtondownCardSettings from './ButtondownCardSettings.svelte';

export const ButtondownCardDefinition: CardDefinition = {
	type: 'buttondown',
	contentComponent: ButtondownCard,
	settingsComponent: ButtondownCardSettings,
	createNew: (card) => {
		card.cardData = {
			title: 'Subscribe',
			description: 'Get updates straight to your inbox.',
			buttonText: 'Subscribe',
			placeholder: 'you@example.com',
			successMessage: 'Thanks! Check your inbox to confirm.'
		};
		card.w = 4;
		card.h = 2;
		card.mobileW = 8;
		card.mobileH = 3;
	},

	defaultColor: 'base',
	allowSetColor: true,
	canHaveLabel: false,

	minW: 3,
	minH: 2,
	maxW: 8,
	maxH: 4,

	name: 'Buttondown',
	keywords: ['buttondown', 'newsletter', 'subscribe', 'mailing list', 'email', 'signup'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>`
};
