import type { Item } from '../types';
import { COLUMNS, margin, mobileMargin } from '$lib';
import * as TID from '@atcute/tid';

export function sortItems(a: Item, b: Item) {
	return a.y * COLUMNS + a.x - b.y * COLUMNS - b.x;
}

export function createEmptyCard(page: string, sectionId?: string) {
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
		page,
		sectionId
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
