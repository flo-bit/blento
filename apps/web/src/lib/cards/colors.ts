import type { Item } from '$lib/types';
import { convertCSSToHex, hex_to_okhsv } from '@foxui/colors';

export function getCSSVar(variable: string) {
	return getComputedStyle(document.body).getPropertyValue(variable).trim();
}

export function getHexCSSVar(variable: string) {
	return convertCSSToHex(getCSSVar(variable));
}

/**
 * Converts a CSS color string to a hue value in the 0-1 range
 */
export function colorToHue(color: string): number {
	const hex = convertCSSToHex(color);
	const okhsv = hex_to_okhsv(hex);
	return okhsv.h;
}

export function getHexOfCardColor(item: Item) {
	const color =
		!item.color || item.color === 'transparent' || item.color === 'base' ? 'accent' : item.color;

	return convertCSSToHex(getCSSVar(`--color-${color}-500`));
}
