import type { SectionDefinition } from '../types';
import EditingTextSection from './EditingTextSection.svelte';
import TextSection from './TextSection.svelte';
import { defaultTextSectionData } from './shared';

export * from './shared';

export const TextSectionDefinition: SectionDefinition = {
	type: 'text',
	contentComponent: TextSection,
	editingContentComponent: EditingTextSection,
	defaultSectionData: defaultTextSectionData,
	addItem: (_item, allItems) => allItems,
	deleteItem: (_itemId, allItems) => allItems,
	resizeItem: () => {},
	name: 'Text',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`
};
