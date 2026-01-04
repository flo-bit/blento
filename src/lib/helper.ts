import { createContext } from 'svelte';
import type { Item } from './types';

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export const colors = [
	'bg-red-500',
	'bg-orange-500',
	'bg-amber-500',
	'bg-yellow-500',
	'bg-lime-500',
	'bg-green-500',
	'bg-emerald-500',
	'bg-teal-500',
	'bg-cyan-500',
	'bg-sky-500',
	'bg-blue-500',
	'bg-indigo-500',
	'bg-violet-500',
	'bg-purple-500',
	'bg-fuchsia-500',
	'bg-pink-500',
	'bg-rose-500'
];

export const overlaps = (a: Item, b: Item, mobile: boolean = false) => {
	if (a === b) return false;
	if (mobile) {
		return (
			a.mobileX < b.mobileX + b.mobileW &&
			a.mobileX + a.mobileW > b.mobileX &&
			a.mobileY < b.mobileY + b.mobileH &&
			a.mobileY + a.mobileH > b.mobileY
		);
	}
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
};

export function fixCollisions(items: Item[], movedItem: Item, mobile: boolean = false) {
	const COLS = 4;

	const clampX = (item: Item) => {
		if (mobile) item.mobileX = clamp(item.mobileX, 0, COLS - item.mobileW);
		else item.x = clamp(item.x, 0, COLS - item.w);
	};

	// Push `target` down until it no longer overlaps with any item (including movedItem),
	// while keeping target.x fixed. Any item we collide with gets pushed down first (cascade).
	const pushDownCascade = (target: Item, blocker: Item) => {
		// Keep x fixed always when pushing down
		const fixedX = mobile ? target.mobileX : target.x;

		// We need target to move just below `blocker`
		const desiredY = mobile ? blocker.mobileY + blocker.mobileH : blocker.y + blocker.h;
		if (!mobile && target.y < desiredY) target.y = desiredY;
		if (mobile && target.mobileY < desiredY) target.mobileY = desiredY;

		// Now resolve any collisions that creates by pushing those items down first
		// Repeat until target is clean.
		while (true) {
			const hit = items.find((it) => it !== target && overlaps(target, it, mobile));
			if (!hit) break;

			// push the hit item down first (cascade), keeping its x fixed
			pushDownCascade(hit, target);

			// after moving the hit item, target.x must remain fixed
			if (mobile) target.mobileX = fixedX;
			else target.x = fixedX;
		}
	};

	// Ensure moved item is in bounds
	clampX(movedItem);

	// Find all items colliding with movedItem, and push them down in a stable order:
	// top-to-bottom so you get the nice chain reaction (0,0 -> 0,1 -> 0,2).
	const colliders = items
		.filter((it) => it !== movedItem && overlaps(movedItem, it, mobile))
		.toSorted((a, b) =>
			mobile ? a.mobileY - b.mobileY || a.mobileX - b.mobileX : a.y - b.y || a.x - b.x
		);

	for (const it of colliders) {
		// keep x clamped, but do NOT change x during push (we rely on fixed x)
		clampX(it);

		// push it down just below movedItem; cascade handles the rest
		pushDownCascade(it, movedItem);

		// enforce "x stays the same" during pushing (clamp already applied)
		if (mobile) it.mobileX = clamp(it.mobileX, 0, COLS - it.mobileW);
		else it.x = clamp(it.x, 0, COLS - it.w);
	}
}

export function sortItems(a: Item, b: Item) {
	return a.y * 4 + a.x - b.y * 4 - b.x;
}

export function cardsEqual(a: Item, b: Item) {
	return (
		a.id === b.id &&
		a.cardType === b.cardType &&
		JSON.stringify(a.cardData) === JSON.stringify(b.cardData) &&
		a.w === b.w &&
		a.h === b.h &&
		a.mobileW === b.mobileW &&
		a.mobileH === b.mobileH &&
		a.x === b.x &&
		a.y === b.y &&
		a.mobileX === b.mobileX &&
		a.mobileY === b.mobileY
	);
}

export function setPositionOfNewItem(newItem: Item, items: Item[]) {
	let foundPosition = false;
	while (!foundPosition) {
		for (newItem.x = 0; newItem.x <= 4 - newItem.w; newItem.x++) {
			const collision = items.find((item) => overlaps(newItem, item));
			if (!collision) {
				foundPosition = true;
				break;
			}
		}
		if (!foundPosition) newItem.y += 1;
	}

	let foundMobilePosition = false;
	while (!foundMobilePosition) {
		for (newItem.mobileX = 0; newItem.mobileX <= 4 - newItem.mobileW; newItem.mobileX += 1) {
			const collision = items.find((item) => overlaps(newItem, item, true));

			if (!collision) {
				foundMobilePosition = true;
				break;
			}
		}
		if (!foundMobilePosition) newItem.mobileY! += 2;
	}
}

export const [getIsMobile, setIsMobile] = createContext<() => boolean>();
