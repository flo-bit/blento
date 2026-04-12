import { COLUMNS } from '$lib';
import { CardDefinitionsByType } from '$lib/cards';
import { clamp } from '$lib/helper';
import { findValidPosition } from './algorithms';
import type { Item } from '$lib/types';

export type LayoutMode = 'desktop-leads' | 'mobile-leads' | 'independent';

/**
 * Determine whether mirroring should happen and in which direction.
 * Returns 'desktop' or 'mobile' for the source layout, or false if no mirroring.
 *
 * @param editedOn - bitflag: 0=never, 1=desktop, 2=mobile, 3=both
 * @param layoutMode - explicit override (takes precedence when set)
 * @param editingMobile - true if the current edit is on mobile
 */
export function shouldMirror(
	editedOn: number | undefined,
	layoutMode: LayoutMode | undefined,
	editingMobile: boolean
): boolean {
	if (layoutMode) {
		if (layoutMode === 'independent') return false;
		if (layoutMode === 'desktop-leads') return !editingMobile;
		if (layoutMode === 'mobile-leads') return editingMobile;
		return false;
	}
	// Legacy behavior: mirror as long as both layouts haven't been edited
	return (editedOn ?? 0) !== 3;
}

/** Snap a value to the nearest even integer (min 2). */
function snapEven(v: number): number {
	return Math.max(2, Math.round(v / 2) * 2);
}

/**
 * Compute the other layout's size for a single item, preserving aspect ratio.
 * Clamps to the card definition's minW/maxW/minH/maxH if defined.
 * Mutates the item in-place.
 */
export function mirrorItemSize(item: Item, fromMobile: boolean): void {
	const def = CardDefinitionsByType[item.cardType];

	if (fromMobile) {
		// Mobile → Desktop: halve both dimensions, then clamp to card def constraints
		// (constraints are in desktop units)
		item.w = clamp(snapEven(item.mobileW / 2), def?.minW ?? 2, def?.maxW ?? COLUMNS);
		item.h = clamp(Math.round(item.mobileH / 2), def?.minH ?? 1, def?.maxH ?? Infinity);
	} else {
		// Desktop → Mobile: double both dimensions
		// (don't apply card def constraints — they're in desktop units)
		item.mobileW = Math.min(item.w * 2, COLUMNS);
		item.mobileH = Math.max(item.h * 2, 2);
	}
}

/**
 * Mirror the full layout from one view to the other.
 * Copies sizes proportionally and reflows items in reading order, then resolves collisions.
 * Mutates items in-place.
 */
export function mirrorLayout(items: Item[], fromMobile: boolean): void {
	// Mirror sizes first
	for (const item of items) {
		mirrorItemSize(item, fromMobile);
	}

	if (fromMobile) {
		// Mobile → Desktop: reflow items in mobile reading order
		const sorted = items.toSorted((a, b) => a.mobileY - b.mobileY || a.mobileX - b.mobileX);
		const placed: Item[] = [];
		for (const item of sorted) {
			item.x = 0;
			item.y = 0;
			findValidPosition(item, placed, false);
			placed.push(item);
		}
	} else {
		// Desktop → Mobile: reflow items in desktop reading order
		const sorted = items.toSorted((a, b) => a.y - b.y || a.x - b.x);
		const placed: Item[] = [];
		for (const item of sorted) {
			item.mobileX = 0;
			item.mobileY = 0;
			findValidPosition(item, placed, true);
			placed.push(item);
		}
	}
}
