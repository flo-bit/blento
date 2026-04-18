import type { Item } from '$lib/types';
import type { SectionDefinition } from '../types';
import EditingHeroSection from './EditingHeroSection.svelte';
import HeroSection from './HeroSection.svelte';
import { DEFAULT_DECORATION_SLOTS, canFitInSlot, defaultHeroSectionData } from './shared';

export * from './shared';

export const HeroSectionDefinition: SectionDefinition = {
	type: 'hero',
	contentComponent: HeroSection,
	editingContentComponent: EditingHeroSection,
	defaultSectionData: defaultHeroSectionData,
	cardFilter: canFitInSlot,
	allowRotate: true,
	addItem: (item: Item, allItems: Item[], options) => {
		item.w = 2;
		item.h = 2;
		item.mobileW = 2;
		item.mobileH = 2;
		const slotId = options.extraData?.slotId;
		if (slotId) {
			item.cardData._slotId = slotId;
			const slot = DEFAULT_DECORATION_SLOTS.find((s) => s.id === slotId);
			if (slot && item.rotation === undefined) {
				item.rotation = slot.rotation;
			}
		}
		return [...allItems, item];
	},
	deleteItem: (itemId: string, allItems: Item[]) => allItems.filter((i) => i.id !== itemId),
	resizeItem: () => {},
	name: 'Hero',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 10h10"/><path d="M7 14h6"/></svg>`
};
