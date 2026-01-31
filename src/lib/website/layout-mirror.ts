import { COLUMNS } from '$lib';
import { CardDefinitionsByType } from '$lib/cards';
import { clamp, findValidPosition, fixAllCollisions } from '$lib/helper';
import type { Item } from '$lib/types';

/**
 * Returns true when mirroring should still happen (i.e. user hasn't edited both layouts).
 * editedOn: 0/undefined = never, 1 = desktop only, 2 = mobile only, 3 = both
 */
export function shouldMirror(editedOn: number | undefined): boolean {
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
 * Copies sizes proportionally and maps positions, then resolves collisions.
 * Mutates items in-place.
 */
export function mirrorLayout(items: Item[], fromMobile: boolean): void {
	// Mirror sizes first
	for (const item of items) {
		mirrorItemSize(item, fromMobile);
	}

	if (fromMobile) {
		// Mobile → Desktop: reflow items to use the full grid width.
		// Sort by mobile position so items are placed in reading order.
		const sorted = items.toSorted((a, b) => a.mobileY - b.mobileY || a.mobileX - b.mobileX);

		// Place each item into the first available spot on the desktop grid
		const placed: Item[] = [];
		for (const item of sorted) {
			item.x = 0;
			item.y = 0;
			findValidPosition(item, placed, false);
			placed.push(item);
		}
	} else {
		// Desktop → Mobile: proportional positions
		for (const item of items) {
			item.mobileX = clamp(Math.floor((item.x * 2) / 2) * 2, 0, COLUMNS - item.mobileW);
			item.mobileY = Math.max(0, Math.round(item.y * 2));
		}
		fixAllCollisions(items, true);
	}
}
