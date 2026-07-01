import { COLUMNS } from '$lib';
import {
	setPositionOfNewItem,
	fixCollisions,
	compactItems,
	getViewportCenterGridY
} from '$lib/layout';
import type { Item } from '$lib/types';
import type { AddItemOptions } from '../types';

export function addItemToGridSection(
	item: Item,
	allItems: Item[],
	options: AddItemOptions
): Item[] {
	const sectionItems = allItems.filter((i) => i.sectionId === item.sectionId);
	const viewportCenter = options.gridRef
		? getViewportCenterGridY(options.gridRef, options.isMobile)
		: undefined;
	setPositionOfNewItem(item, sectionItems, viewportCenter);

	const newItems = [...allItems, item];
	const updatedSectionItems = newItems.filter((i) => i.sectionId === item.sectionId);

	fixCollisions(updatedSectionItems, item, false, true);
	fixCollisions(updatedSectionItems, item, true, true);
	compactItems(updatedSectionItems, false);
	compactItems(updatedSectionItems, true);

	return newItems;
}

export function positionItemAtGridPos(item: Item, gridX: number, gridY: number, isMobile: boolean) {
	if (isMobile) {
		item.mobileX = gridX;
		item.mobileY = gridY;
		item.x = Math.floor((COLUMNS - item.w) / 2);
		item.y = Math.max(0, Math.round(gridY / 2));
	} else {
		item.x = gridX;
		item.y = gridY;
		item.mobileX = Math.floor((COLUMNS - item.mobileW) / 2);
		item.mobileY = Math.max(0, Math.round(gridY * 2));
	}
}
