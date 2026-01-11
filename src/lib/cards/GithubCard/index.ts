import type { CardDefinition } from '../types';
import CreateGithubCardModal from './CreateGithubCardModal.svelte';
import GithubCard from './GithubCard.svelte';
import SidebarItemGithubCard from './SidebarItemGithubCard.svelte';

export const GithubCardDefinition = {
	type: 'github',
	contentComponent: GithubCard,
	createNew: (card) => {
		card.cardType = 'github';
		card.cardData = {
			username: ''
		};
	},
	creationModalComponent: CreateGithubCardModal,
	sidebarComponent: SidebarItemGithubCard
} as CardDefinition & { type: 'github' };
