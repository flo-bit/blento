import type { CardDefinition } from '../types';
import BlueskyMediaCard from './BlueskyMediaCard.svelte';
import CreateBlueskyMediaCardModal from './CreateBlueskyMediaCardModal.svelte';
import SidebarItemBlueskyMediaCard from './SidebarItemBlueskyMediaCard.svelte';

export const BlueskyMediaCardDefinition = {
	type: 'blueskyMedia',
	contentComponent: BlueskyMediaCard,
	createNew: () => {},
	creationModalComponent: CreateBlueskyMediaCardModal,
	sidebarButtonText: 'Bluesky Media',
	sidebarComponent: SidebarItemBlueskyMediaCard,
	canHaveLabel: true
} as CardDefinition & { type: 'blueskyMedia' };
