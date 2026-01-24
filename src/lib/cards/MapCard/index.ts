import type { CardDefinition } from '../types';
import CreateMapCardModal from './CreateMapCardModal.svelte';
import MapCard from './MapCard.svelte';
import MapCardSettings from './MapCardSettings.svelte';

export const MapCardDefinition = {
	type: 'mapLocation',
	contentComponent: MapCard,
	sidebarButtonText: 'Map',
	createNew: (item) => {
		item.w = 4;
		item.h = 4;
		item.mobileH = 8;
		item.mobileW = 8;
	},

	creationModalComponent: CreateMapCardModal,
	allowSetColor: false,
	canHaveLabel: true,
	settingsComponent: MapCardSettings
} as CardDefinition & { type: 'mapLocation' };

export function getZoomLevel(type: string | undefined): number {
	if (
		['house', 'building', 'address', 'street', 'road', 'residential', 'highway'].includes(
			type || ''
		)
	) {
		return 13;
	}
	if (['neighbourhood', 'suburb', 'quarter', 'district', 'postcode'].includes(type || '')) {
		return 12;
	}
	return 1;
}
