import { fixCollisions, compactItems } from '$lib/layout';
import type { Item } from '$lib/types';
import type { SectionDefinition } from '../types';
import { addItemToGridSection } from './add-item';
import EditingGridSection from './EditingGridSection.svelte';
import GridSection from './GridSection.svelte';
import { GRID_SECTION_NAME, GRID_SECTION_ICON } from './shared';

export * from './shared';

function getSectionItems(allItems: Item[], sectionId: string) {
	return allItems.filter((i) => i.sectionId === sectionId);
}

export const GridSectionDefinition: SectionDefinition = {
	type: 'grid',
	contentComponent: GridSection,
	editingContentComponent: EditingGridSection,
	addItem: (item, allItems, options) => addItemToGridSection(item, allItems, options),
	deleteItem: (itemId, allItems, sectionId) => {
		const newItems = allItems.filter((i) => i.id !== itemId);
		const sectionItems = getSectionItems(newItems, sectionId);
		compactItems(sectionItems, false);
		compactItems(sectionItems, true);
		return newItems;
	},
	resizeItem: (item, allItems, w, h, isMobile) => {
		if (isMobile) {
			item.mobileW = w;
			item.mobileH = h;
		} else {
			item.w = w;
			item.h = h;
		}
		const sectionItems = getSectionItems(allItems, item.sectionId!);
		fixCollisions(sectionItems, item, isMobile);
	},
	name: GRID_SECTION_NAME,
	icon: GRID_SECTION_ICON
};
