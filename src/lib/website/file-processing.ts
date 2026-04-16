import { createEmptyCard } from '$lib/helper';
import type { Item } from '$lib/types';

export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
		img.onerror = () => resolve({ width: 1, height: 1 });
		img.src = src;
	});
}

export function getBestGridSize(
	imageWidth: number,
	imageHeight: number,
	candidates: [number, number][]
): [number, number] {
	const imageRatio = imageWidth / imageHeight;
	let best = candidates[0];
	let bestDiff = Infinity;

	for (const [w, h] of candidates) {
		const gridRatio = w / h;
		const diff = Math.abs(gridRatio - imageRatio);
		if (diff < bestDiff) {
			bestDiff = diff;
			best = [w, h];
		}
	}

	return best;
}

const desktopSizeCandidates: [number, number][] = [
	[2, 2],
	[2, 4],
	[4, 2],
	[4, 4],
	[4, 6],
	[6, 4]
];

const mobileSizeCandidates: [number, number][] = [
	[4, 4],
	[4, 6],
	[4, 8],
	[6, 4],
	[8, 4],
	[8, 6]
];

export async function createImageCard(file: File, page: string, sectionId?: string): Promise<Item> {
	const isGif = file.type === 'image/gif';
	const objectUrl = URL.createObjectURL(file);

	const item = createEmptyCard(page, sectionId);
	item.cardType = isGif ? 'gif' : 'image';
	item.cardData = { image: { blob: file, objectUrl } };

	const { width, height } = await getImageDimensions(objectUrl);
	const [dw, dh] = getBestGridSize(width, height, desktopSizeCandidates);
	const [mw, mh] = getBestGridSize(width, height, mobileSizeCandidates);
	item.w = dw;
	item.h = dh;
	item.mobileW = mw;
	item.mobileH = mh;

	return item;
}

export function createVideoCard(file: File, page: string, sectionId?: string): Item {
	const objectUrl = URL.createObjectURL(file);

	const item = createEmptyCard(page, sectionId);
	item.cardType = 'video';
	item.cardData = { blob: file, objectUrl };

	return item;
}
