import type { SectionDefinition } from '../types';
import EditingRowSection from './EditingRowSection.svelte';
import RowSection from './RowSection.svelte';

export function defaultRowSectionData(): Record<string, any> {
	return {
		scrollMode: 'scroll' // 'scroll' | 'fit'
	};
}

export const RowSectionDefinition: SectionDefinition = {
	type: 'row',
	contentComponent: RowSection,
	editingContentComponent: EditingRowSection,
	defaultSectionData: defaultRowSectionData,
	cardFilter: (def) => (def.minW ?? 2) <= 2 && (def.minH ?? 2) <= 2,
	allowRotate: true,
	addItem: (item, allItems) => {
		item.w = 2;
		item.h = 2;
		item.mobileW = 4;
		item.mobileH = 4;
		const sectionItems = allItems.filter((i) => i.sectionId === item.sectionId);
		item.x = sectionItems.length;
		item.y = 0;
		item.mobileX = 0;
		item.mobileY = sectionItems.length;
		return [...allItems, item];
	},
	deleteItem: (itemId, allItems) => allItems.filter((i) => i.id !== itemId),
	resizeItem: () => {},
	name: 'Row',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="8" width="5" height="8" rx="1"/><rect x="10" y="8" width="5" height="8" rx="1"/><rect x="17" y="8" width="5" height="8" rx="1"/></svg>`
};
