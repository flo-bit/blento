import { type LayoutItem, type Layout } from 'react-grid-layout/core';
import {
	collides,
	moveElement,
	correctBounds,
	getFirstCollision,
	verticalCompactor
} from 'react-grid-layout/core';
import type { Item } from './types';
import { COLUMNS } from '$lib';
import { clamp } from './helper';

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
	skipCompact: boolean = false
) {
	if (mobile) item.mobileX = clamp(item.mobileX, 0, COLUMNS - item.mobileW);
	else item.x = clamp(item.x, 0, COLUMNS - item.w);

	let layout = toLayout(items, mobile);

	const movedLayoutItem = layout.find((i) => i.i === item.id);

	if (!movedLayoutItem) {
		console.error('item not found in layout! this should never happen!');
		return;
	}

	layout = moveElement(
		layout,
		movedLayoutItem,
		movedLayoutItem.x,
		movedLayoutItem.y,
		true,
		false,
		'vertical',
		COLUMNS
	);

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
