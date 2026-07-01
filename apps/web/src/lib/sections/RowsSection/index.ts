import type { SectionDefinition } from '../types';
import EditingRowsSection from './EditingRowsSection.svelte';
import RowsSection from './RowsSection.svelte';

export const RowsSectionDefinition: SectionDefinition = {
	type: 'rows',
	contentComponent: RowsSection,
	editingContentComponent: EditingRowsSection,
	addItem: (item, allItems) => {
		const sectionItems = allItems.filter((i) => i.sectionId === item.sectionId);
		// Full-width rows stacked vertically; ordered by y.
		item.w = 8;
		item.h = 2;
		item.x = 0;
		item.y = sectionItems.length;
		item.mobileW = 8;
		item.mobileH = 2;
		item.mobileX = 0;
		item.mobileY = sectionItems.length;
		return [...allItems, item];
	},
	deleteItem: (itemId, allItems) => allItems.filter((i) => i.id !== itemId),
	resizeItem: () => {},
	name: 'Rows',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="5" width="18" height="4" rx="1"/><rect x="3" y="15" width="18" height="4" rx="1"/></svg>`
};
