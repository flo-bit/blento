import type { Item } from '$lib/types';

/**
 * CSS aspect-ratio for a single-card section. When `aspect` is 'fit' the card's
 * natural aspect ratio (from cardData.aspectRatio, e.g. images) is used, falling
 * back to 16/9.
 */
export function singleCardAspectStyle(item: Item | undefined, aspect: string): string {
	if (aspect && aspect !== 'fit') return `aspect-ratio: ${aspect};`;
	// "Fit": media cards keep their natural proportions; content cards (headings,
	// text, …) size to their own content height.
	const ar = item?.cardData?.aspectRatio as { width?: number; height?: number } | undefined;
	if (ar?.width && ar?.height) return `aspect-ratio: ${ar.width} / ${ar.height};`;
	return '';
}

export function defaultSingleCardSectionData(): Record<string, any> {
	return {
		aspect: 'fit'
	};
}
