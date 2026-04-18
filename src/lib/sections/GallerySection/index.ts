import type { SectionDefinition } from '../types';
import EditingGallerySection from './EditingGallerySection.svelte';
import GallerySection from './GallerySection.svelte';

export function defaultGallerySectionData(): Record<string, any> {
	return {
		columns: 3,
		gap: 2
	};
}

export const GallerySectionDefinition: SectionDefinition = {
	type: 'gallery',
	contentComponent: GallerySection,
	editingContentComponent: EditingGallerySection,
	defaultSectionData: defaultGallerySectionData,
	cardFilter: (def) => def.type === 'image' || def.type === 'gif',
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
	name: 'Gallery',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`
};
