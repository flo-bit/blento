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

	// Build a lookup of original cards by ID for O(1) access
	const originalCardsById = new Map<string, Item>();
	for (const card of data.cards) {
		originalCardsById.set(card.id, card);
	}

	// find all cards that have been updated (where items differ from originalItems)
	for (let item of currentItems) {
		const orig = originalCardsById.get(item.id);
		const originalItem = orig && cardsEqual(orig, item) ? orig : undefined;

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
