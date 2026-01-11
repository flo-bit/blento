import type { CardDefinition } from '../types';
import CreateMapCardModal from './CreateMapCardModal.svelte';
import MapCard from './MapCard.svelte';
import SidebarItemMapCard from './SidebarItemMapCard.svelte';

export const MapCardDefinition = {
	type: 'mapLocation',
	contentComponent: MapCard,
	sidebarButtonText: 'map',
	createNew: (item) => {
		item.w = 4;
		item.h = 4;
		item.mobileH = 8;
		item.mobileW = 8;
	},

	sidebarComponent: SidebarItemMapCard,
	creationModalComponent: CreateMapCardModal
} as CardDefinition & { type: 'mapLocation' };
