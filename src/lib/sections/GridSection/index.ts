import { fixCollisions, compactItems } from '$lib/layout';
import type { Item } from '$lib/types';
import type { SectionDefinition } from '../types';
import { addItemToGridSection } from './add-item';
import EditingGridSection from './EditingGridSection.svelte';
import GridSection from './GridSection.svelte';

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
	name: 'Grid',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`
};
