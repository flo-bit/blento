import type { Item, WebsiteData } from './types';
import { COLUMNS, margin, mobileMargin } from '$lib';
import { CardDefinitionsByType } from './cards';
import { deleteRecord, getCDNImageBlobUrl, putRecord, uploadBlob } from '$lib/atproto';
import * as TID from '@atcute/tid';

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

export function fixCollisions(
	items: Item[],
	movedItem: Item,
	mobile: boolean = false,
	skipCompact: boolean = false
) {
	const clampX = (item: Item) => {
		if (mobile) item.mobileX = clamp(item.mobileX, 0, COLUMNS - item.mobileW);
		else item.x = clamp(item.x, 0, COLUMNS - item.w);
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
		if (mobile) it.mobileX = clamp(it.mobileX, 0, COLUMNS - it.mobileW);
		else it.x = clamp(it.x, 0, COLUMNS - it.w);
	}

	if (!skipCompact) {
		compactItems(items, mobile);
	}
}

// Fix all collisions between items (not just one moved item)
// Items higher on the page have priority and stay in place
export function fixAllCollisions(items: Item[], mobile: boolean = false) {
	// Sort by Y position (top-to-bottom, then left-to-right)
	// Items at the top have priority and won't be moved
	const sortedItems = items.toSorted((a, b) =>
		mobile ? a.mobileY - b.mobileY || a.mobileX - b.mobileX : a.y - b.y || a.x - b.x
	);

	// Process each item and push it down if it overlaps with any item above it
	for (let i = 0; i < sortedItems.length; i++) {
		const item = sortedItems[i];

		// Clamp X to valid range
		if (mobile) {
			item.mobileX = clamp(item.mobileX, 0, COLUMNS - item.mobileW);
		} else {
			item.x = clamp(item.x, 0, COLUMNS - item.w);
		}

		// Check for collisions with all items that come before (higher priority)
		let hasCollision = true;
		while (hasCollision) {
			hasCollision = false;
			for (let j = 0; j < i; j++) {
				const other = sortedItems[j];
				if (overlaps(item, other, mobile)) {
					// Push item down below the colliding item
					if (mobile) {
						item.mobileY = other.mobileY + other.mobileH;
					} else {
						item.y = other.y + other.h;
					}
					hasCollision = true;
					break; // Restart collision check from the beginning
				}
			}
		}
	}

	compactItems(items, mobile);
}

// Move all items up as far as possible without collisions
export function compactItems(items: Item[], mobile: boolean = false) {
	// Sort by Y position (top-to-bottom) so upper items settle first.
	const sortedItems = items.toSorted((a, b) =>
		mobile ? a.mobileY - b.mobileY || a.mobileX - b.mobileX : a.y - b.y || a.x - b.x
	);

	for (const item of sortedItems) {
		// Try moving item up row by row until we hit y=0 or a collision
		while (true) {
			const currentY = mobile ? item.mobileY : item.y;
			if (currentY <= 0) break;

			// Temporarily move up by 1
			if (mobile) item.mobileY -= 1;
			else item.y -= 1;

			// Check for collision with any other item
			const hasCollision = items.some((other) => other !== item && overlaps(item, other, mobile));

			if (hasCollision) {
				// Revert the move
				if (mobile) item.mobileY += 1;
				else item.y += 1;
				break;
			}
			// No collision, keep the new position and try moving up again
		}
	}
}

// Simulate where an item would end up after fixCollisions + compaction
export function simulateFinalPosition(
	items: Item[],
	movedItem: Item,
	newX: number,
	newY: number,
	mobile: boolean = false
): { x: number; y: number } {
	// Deep clone positions for simulation
	const clonedItems: Item[] = items.map((item) => ({
		...item,
		x: item.x,
		y: item.y,
		mobileX: item.mobileX,
		mobileY: item.mobileY
	}));

	const clonedMovedItem = clonedItems.find((item) => item.id === movedItem.id);
	if (!clonedMovedItem) return { x: newX, y: newY };

	// Set the new position
	if (mobile) {
		clonedMovedItem.mobileX = newX;
		clonedMovedItem.mobileY = newY;
	} else {
		clonedMovedItem.x = newX;
		clonedMovedItem.y = newY;
	}

	// Run fixCollisions on the cloned data
	fixCollisions(clonedItems, clonedMovedItem, mobile);

	// Return the final position of the moved item
	return mobile
		? { x: clonedMovedItem.mobileX, y: clonedMovedItem.mobileY }
		: { x: clonedMovedItem.x, y: clonedMovedItem.y };
}

export function sortItems(a: Item, b: Item) {
	return a.y * COLUMNS + a.x - b.y * COLUMNS - b.x;
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
		a.mobileY === b.mobileY &&
		a.color === b.color &&
		a.page === b.page
	);
}

export function setPositionOfNewItem(newItem: Item, items: Item[]) {
	let foundPosition = false;
	while (!foundPosition) {
		for (newItem.x = 0; newItem.x <= COLUMNS - newItem.w; newItem.x++) {
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
		for (newItem.mobileX = 0; newItem.mobileX <= COLUMNS - newItem.mobileW; newItem.mobileX += 1) {
			const collision = items.find((item) => overlaps(newItem, item, true));

			if (!collision) {
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
	if (mobile) {
		let foundPosition = false;
		newItem.mobileY = 0;
		while (!foundPosition) {
			for (newItem.mobileX = 0; newItem.mobileX <= COLUMNS - newItem.mobileW; newItem.mobileX++) {
				const collision = items.find((item) => overlaps(newItem, item, true));
				if (!collision) {
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
				const collision = items.find((item) => overlaps(newItem, item, false));
				if (!collision) {
					foundPosition = true;
					break;
				}
			}
			if (!foundPosition) newItem.y += 1;
		}
	}
}

export async function refreshData(data: { updatedAt?: number; handle: string }) {
	const TEN_MINUTES = 10 * 60 * 1000;
	const now = Date.now();

	if (now - (data.updatedAt || 0) > TEN_MINUTES) {
		try {
			await fetch('/' + data.handle + '/api/refresh');
			console.log('successfully refreshed data', data.handle);
		} catch (error) {
			console.error('error refreshing data', error);
		}
	} else {
		console.log('data still fresh, skipping refreshing', data.handle);
	}
}

export function getName(data: WebsiteData): string {
	return data.publication?.name || data.profile.displayName || data.handle;
}

export function getDescription(data: WebsiteData): string {
	return data.publication?.description ?? data.profile.description ?? '';
}

export function getHideProfileSection(data: WebsiteData): boolean {
	if (data?.publication?.preferences?.hideProfileSection !== undefined)
		return data?.publication?.preferences?.hideProfileSection;

	if (data?.publication?.preferences?.hideProfile !== undefined)
		return data?.publication?.preferences?.hideProfile;

	return data.page !== 'blento.self';
}

export function getProfilePosition(data: WebsiteData): 'side' | 'top' {
	return data?.publication?.preferences?.profilePosition ?? 'side';
}

export function isTyping() {
	const active = document.activeElement;

	const isEditable =
		active instanceof HTMLInputElement ||
		active instanceof HTMLTextAreaElement ||
		// @ts-expect-error this fine
		active?.isContentEditable;

	return isEditable;
}

export function validateLink(
	link: string | undefined,
	tryAdding: boolean = true
): string | undefined {
	if (!link) return;
	try {
		new URL(link);

		return link;
	} catch (e) {
		if (!tryAdding) return;

		try {
			link = 'https://' + link;
			new URL(link);

			return link;
		} catch (e) {
			return;
		}
	}
}

export function compressImage(file: File | Blob, maxSize: number = 900 * 1024): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const reader = new FileReader();

		reader.onload = (e) => {
			if (!e.target?.result) {
				return reject(new Error('Failed to read file.'));
			}
			img.src = e.target.result as string;
		};

		reader.onerror = (err) => reject(err);
		reader.readAsDataURL(file);

		img.onload = () => {
			const maxDimension = 2048;

			// If image is already small enough, return original
			if (file.size <= maxSize) {
				console.log('skipping compression+resizing, already small enough');
				return resolve(file);
			}

			let width = img.width;
			let height = img.height;

			if (width > maxDimension || height > maxDimension) {
				if (width > height) {
					height = Math.round((maxDimension / width) * height);
					width = maxDimension;
				} else {
					width = Math.round((maxDimension / height) * width);
					height = maxDimension;
				}
			}

			// Create a canvas to draw the image
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) return reject(new Error('Failed to get canvas context.'));
			ctx.drawImage(img, 0, 0, width, height);

			// Use WebP for both compression and transparency support
			let quality = 0.9;

			function attemptCompression() {
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							return reject(new Error('Compression failed.'));
						}
						if (blob.size <= maxSize || quality < 0.3) {
							resolve(blob);
						} else {
							quality -= 0.1;
							attemptCompression();
						}
					},
					'image/webp',
					quality
				);
			}

			attemptCompression();
		};

		img.onerror = (err) => reject(err);
	});
}

export async function savePage(
	data: WebsiteData,
	currentItems: Item[],
	originalPublication: string
) {
	const promises = [];
	// find all cards that have been updated (where items differ from originalItems)
	for (let item of currentItems) {
		const originalItem = data.cards.find((i) => cardsEqual(i, item));

		if (!originalItem) {
			console.log('updated or new item', item);
			item.updatedAt = new Date().toISOString();
			// run optional upload function for this card type
			const cardDef = CardDefinitionsByType[item.cardType];

			if (cardDef?.upload) {
				item = await cardDef?.upload(item);
			}

			const parsedItem = JSON.parse(JSON.stringify(item));

			parsedItem.page = data.page;
			parsedItem.version = 2;

			promises.push(
				putRecord({
					collection: 'app.blento.card',
					rkey: parsedItem.id,
					record: parsedItem
				})
			);
		}
	}

	// delete items that are in originalItems but not in items
	for (const originalItem of data.cards) {
		const item = currentItems.find((i) => i.id === originalItem.id);
		if (!item) {
			console.log('deleting item', originalItem);
			promises.push(deleteRecord({ collection: 'app.blento.card', rkey: originalItem.id }));
		}
	}

	if (
		data.publication?.preferences?.hideProfile !== undefined &&
		data.publication?.preferences?.hideProfileSection === undefined
	) {
		data.publication.preferences.hideProfileSection = data.publication?.preferences?.hideProfile;
	}

	if (!originalPublication || originalPublication !== JSON.stringify(data.publication)) {
		data.publication ??= {
			name: getName(data),
			description: getDescription(data),
			preferences: {
				hideProfileSection: getHideProfileSection(data)
			}
		};

		if (!data.publication.url) {
			data.publication.url = 'https://blento.app/' + data.handle;

			if (data.page !== 'blento.self') {
				data.publication.url += '/' + data.page.replace('blento.', '');
			}
		}
		if (data.page !== 'blento.self') {
			promises.push(
				putRecord({
					collection: 'app.blento.page',
					rkey: data.page,
					record: data.publication
				})
			);
		} else {
			promises.push(
				putRecord({
					collection: 'site.standard.publication',
					rkey: data.page,
					record: data.publication
				})
			);
		}

		console.log('updating or adding publication', data.publication);
	}

	await Promise.all(promises);
}

export function createEmptyCard(page: string) {
	return {
		id: TID.now(),
		x: 0,
		y: 0,
		w: 2,
		h: 2,
		mobileH: 4,
		mobileW: 4,
		mobileX: 0,
		mobileY: 0,
		cardType: '',
		cardData: {},
		page
	} as Item;
}

export function scrollToItem(
	item: Item,
	isMobile: boolean,
	container: HTMLDivElement | undefined,
	force: boolean = false
) {
	// scroll to newly created card only if not fully visible
	const containerRect = container?.getBoundingClientRect();
	if (!containerRect) return;
	const currentMargin = isMobile ? mobileMargin : margin;
	const currentY = isMobile ? item.mobileY : item.y;
	const currentH = isMobile ? item.mobileH : item.h;
	const cellSize = (containerRect.width - currentMargin * 2) / COLUMNS;

	const cardTop = containerRect.top + currentMargin + currentY * cellSize;
	const cardBottom = containerRect.top + currentMargin + (currentY + currentH) * cellSize;

	const isFullyVisible = cardTop >= 0 && cardBottom <= window.innerHeight;

	if (!isFullyVisible || force) {
		const bodyRect = document.body.getBoundingClientRect();
		const offset = containerRect.top - bodyRect.top;
		window.scrollTo({ top: offset + cellSize * (currentY - 1), behavior: 'smooth' });
	}
}

export async function checkAndUploadImage(
	objectWithImage: Record<string, any>,
	key: string = 'image'
) {
	if (!objectWithImage[key]) return;

	// Already uploaded as blob
	if (typeof objectWithImage[key] === 'object' && objectWithImage[key].$type === 'blob') {
		return;
	}

	if (typeof objectWithImage[key] === 'string') {
		// Download image from URL via proxy (to avoid CORS) and upload as blob
		try {
			const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(objectWithImage[key])}`;
			const response = await fetch(proxyUrl);
			if (!response.ok) {
				console.error('Failed to fetch image:', objectWithImage[key]);
				return;
			}
			const blob = await response.blob();
			const compressedBlob = await compressImage(blob);
			objectWithImage[key] = await uploadBlob({ blob: compressedBlob });
		} catch (error) {
			console.error('Failed to download and upload image:', error);
		}
		return;
	}

	if (objectWithImage[key]?.blob) {
		const compressedBlob = await compressImage(objectWithImage[key].blob);
		objectWithImage[key] = await uploadBlob({ blob: compressedBlob });
	}
}

export function getImage(
	objectWithImage: Record<string, any> | undefined,
	did: string,
	key: string = 'image'
) {
	if (!objectWithImage?.[key]) return;

	if (objectWithImage[key].objectUrl) return objectWithImage[key].objectUrl;

	if (typeof objectWithImage[key] === 'object' && objectWithImage[key].$type === 'blob') {
		return getCDNImageBlobUrl({ did, blob: objectWithImage[key] });
	}
	return objectWithImage[key];
}
