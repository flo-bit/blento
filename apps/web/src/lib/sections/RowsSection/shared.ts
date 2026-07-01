import type { Item } from '$lib/types';

/**
 * Per-row sizing for the Rows section. Media cards (which store a natural
 * aspectRatio, e.g. images/gifs) keep their proportions full-width; everything
 * else (headings, text, links, buttons, …) sizes to its own content height.
 */
export function rowItemStyle(item: Item): string {
	const ar = item?.cardData?.aspectRatio as { width?: number; height?: number } | undefined;
	if (ar?.width && ar?.height) return `aspect-ratio: ${ar.width} / ${ar.height};`;
	return '';
}
