import { type LayoutItem, type Layout } from 'react-grid-layout/core';
import {
	collides,
	moveElement,
	correctBounds,
	getFirstCollision,
	verticalCompactor
} from 'react-grid-layout/core';
import type { Item } from '../types';
import { COLUMNS } from '$lib';
import { clamp } from '../helper';

function toLayoutItem(item: Item, mobile: boolean): LayoutItem {
	if (mobile) {
		return {
			x: item.mobileX,
			y: item.mobileY,
			w: item.mobileW,
			h: item.mobileH,
			i: item.id
		};
	}
	return {
		x: item.x,
		y: item.y,
		w: item.w,
		h: item.h,
		i: item.id
	};
}

function toLayout(items: Item[], mobile: boolean): LayoutItem[] {
	return items.map((i) => toLayoutItem(i, mobile));
}

function applyLayout(items: Item[], layout: LayoutItem[], mobile: boolean): void {
	const itemsMap: Map<string, Item> = new Map();

	for (const item of items) {
		itemsMap.set(item.id, item);
	}
	for (const l of layout) {
		const item = itemsMap.get(l.i);

		if (!item) {
			console.error('item not found in layout!! this should never happen!');
			continue;
		}

		if (mobile) {
			item.mobileX = l.x;
			item.mobileY = l.y;
		} else {
			item.x = l.x;
			item.y = l.y;
		}
	}
}

export function overlaps(a: Item, b: Item, mobile: boolean) {
	if (a === b) return false;
	return collides(toLayoutItem(a, mobile), toLayoutItem(b, mobile));
}

export function fixCollisions(
	items: Item[],
	item: Item,
	mobile: boolean = false,
	skipCompact: boolean = false,
	originalPos?: { x: number; y: number }
) {
	if (mobile) item.mobileX = clamp(item.mobileX, 0, COLUMNS - item.mobileW);
	else item.x = clamp(item.x, 0, COLUMNS - item.w);

	const targetX = mobile ? item.mobileX : item.x;
	const targetY = mobile ? item.mobileY : item.y;

	let layout = toLayout(items, mobile);

	const movedLayoutItem = layout.find((i) => i.i === item.id);

	if (!movedLayoutItem) {
		console.error('item not found in layout! this should never happen!');
		return;
	}

	// If we know the original position, set it on the layout item so
	// moveElement can detect direction and push items properly.
	if (originalPos) {
		movedLayoutItem.x = originalPos.x;
		movedLayoutItem.y = originalPos.y;
	}

	layout = moveElement(layout, movedLayoutItem, targetX, targetY, true, false, 'vertical', COLUMNS);

	if (!skipCompact) layout = verticalCompactor.compact(layout, COLUMNS) as LayoutItem[];

	applyLayout(items, layout, mobile);
}

export function fixAllCollisions(items: Item[], mobile: boolean) {
	let layout = toLayout(items, mobile);
	correctBounds(layout as any, { cols: COLUMNS });
	layout = verticalCompactor.compact(layout, COLUMNS) as LayoutItem[];
	applyLayout(items, layout, mobile);
}

export function compactItems(items: Item[], mobile: boolean) {
	const layout = toLayout(items, mobile);
	const compacted = verticalCompactor.compact(layout, COLUMNS) as LayoutItem[];
	applyLayout(items, compacted, mobile);
}

export function setPositionOfNewItem(
	newItem: Item,
	items: Item[],
	viewportCenter?: { gridY: number; isMobile: boolean }
) {
	const desktopLayout = toLayout(items, false);
	const mobileLayout = toLayout(items, true);

	function hasCollision(mobile: boolean): boolean {
		const layout = mobile ? mobileLayout : desktopLayout;
		return getFirstCollision(layout, toLayoutItem(newItem, mobile)) !== undefined;
	}

	if (viewportCenter) {
		const { gridY, isMobile } = viewportCenter;

		if (isMobile) {
			// Place at viewport center Y
			newItem.mobileY = Math.max(0, Math.round(gridY - newItem.mobileH / 2));
			newItem.mobileY = Math.floor(newItem.mobileY / 2) * 2;

			// Try to find a free X at this Y
			let found = false;
			for (
				newItem.mobileX = 0;
				newItem.mobileX <= COLUMNS - newItem.mobileW;
				newItem.mobileX += 2
			) {
				if (!hasCollision(true)) {
					found = true;
					break;
				}
			}
			if (!found) {
				newItem.mobileX = 0;
			}

			// Desktop: derive from mobile
			newItem.y = Math.max(0, Math.round(newItem.mobileY / 2));
			found = false;
			for (newItem.x = 0; newItem.x <= COLUMNS - newItem.w; newItem.x += 2) {
				if (!hasCollision(false)) {
					found = true;
					break;
				}
			}
			if (!found) {
				newItem.x = 0;
			}
		} else {
			// Place at viewport center Y
			newItem.y = Math.max(0, Math.round(gridY - newItem.h / 2));

			// Try to find a free X at this Y
			let found = false;
			for (newItem.x = 0; newItem.x <= COLUMNS - newItem.w; newItem.x += 2) {
				if (!hasCollision(false)) {
					found = true;
					break;
				}
			}
			if (!found) {
				newItem.x = 0;
			}

			// Mobile: derive from desktop
			newItem.mobileY = Math.max(0, Math.round(newItem.y * 2));
			found = false;
			for (
				newItem.mobileX = 0;
				newItem.mobileX <= COLUMNS - newItem.mobileW;
				newItem.mobileX += 2
			) {
				if (!hasCollision(true)) {
					found = true;
					break;
				}
			}
			if (!found) {
				newItem.mobileX = 0;
			}
		}
		return;
	}

	let foundPosition = false;
	while (!foundPosition) {
		for (newItem.x = 0; newItem.x <= COLUMNS - newItem.w; newItem.x++) {
			if (!hasCollision(false)) {
				foundPosition = true;
				break;
			}
		}
		if (!foundPosition) newItem.y += 1;
	}

	let foundMobilePosition = false;
	while (!foundMobilePosition) {
		for (newItem.mobileX = 0; newItem.mobileX <= COLUMNS - newItem.mobileW; newItem.mobileX += 1) {
			if (!hasCollision(true)) {
				foundMobilePosition = true;
				break;
			}
		}
		if (!foundMobilePosition) newItem.mobileY! += 1;
	}
}

/**
 * Find a valid position for a new item in a single mode (desktop or mobile).
 * This modifies the item's position properties in-place.
 */
export function findValidPosition(newItem: Item, items: Item[], mobile: boolean) {
	const layout = toLayout(items, mobile);

	if (mobile) {
		let foundPosition = false;
		newItem.mobileY = 0;
		while (!foundPosition) {
			for (newItem.mobileX = 0; newItem.mobileX <= COLUMNS - newItem.mobileW; newItem.mobileX++) {
				if (!getFirstCollision(layout, toLayoutItem(newItem, true))) {
					foundPosition = true;
					break;
				}
			}
			if (!foundPosition) newItem.mobileY! += 1;
		}
	} else {
		let foundPosition = false;
		newItem.y = 0;
		while (!foundPosition) {
			for (newItem.x = 0; newItem.x <= COLUMNS - newItem.w; newItem.x++) {
				if (!getFirstCollision(layout, toLayoutItem(newItem, false))) {
					foundPosition = true;
					break;
				}
			}
			if (!foundPosition) newItem.y += 1;
		}
	}
}
