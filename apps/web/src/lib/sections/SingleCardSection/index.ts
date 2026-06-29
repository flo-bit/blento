import type { SectionDefinition } from '../types';
import EditingSingleCardSection from './EditingSingleCardSection.svelte';
import SingleCardSection from './SingleCardSection.svelte';
import SingleCardSectionSettings from './SingleCardSectionSettings.svelte';
import { defaultSingleCardSectionData } from './shared';

export * from './shared';

export const SingleCardSectionDefinition: SectionDefinition = {
	type: 'single',
	contentComponent: SingleCardSection,
	editingContentComponent: EditingSingleCardSection,
	settingsComponent: SingleCardSectionSettings,
	defaultSectionData: defaultSingleCardSectionData,
	addItem: (item, allItems) => {
		// A single-card section holds exactly one full-width card; adding replaces it.
		item.w = 8;
		item.h = 6;
		item.x = 0;
		item.y = 0;
		item.mobileW = 8;
		item.mobileH = 6;
		item.mobileX = 0;
		item.mobileY = 0;
		const others = allItems.filter((i) => i.sectionId !== item.sectionId);
		return [...others, item];
	},
	deleteItem: (itemId, allItems) => allItems.filter((i) => i.id !== itemId),
	resizeItem: () => {},
	name: 'Single card',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`
};
