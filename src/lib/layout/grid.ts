import { COLUMNS, margin, mobileMargin } from '$lib';
import { clamp } from '$lib/helper';
import type { Item } from '$lib/types';

export type GridPosition = {
	x: number;
	y: number;
	swapWithId: string | null;
	placement: 'above' | 'below' | null;
};

export type DragState = {
	item: Item;
	mouseDeltaX: number;
	mouseDeltaY: number;
	originalPositions: Map<string, { x: number; y: number; mobileX: number; mobileY: number }>;
	lastTargetId: string | null;
	lastPlacement: 'above' | 'below' | null;
};

/**
 * Convert client coordinates to a grid position with swap detection and hysteresis.
 * Returns undefined if container or dragState.item is missing.
 * Mutates dragState.lastTargetId and dragState.lastPlacement for hysteresis tracking.
 */
export function getGridPosition(
	clientX: number,
	clientY: number,
	container: HTMLElement,
	dragState: DragState,
	items: Item[],
	isMobile: boolean
): GridPosition | undefined {
	if (!dragState.item) return;

	// x, y represent the top-left corner of the dragged card
	const x = clientX + dragState.mouseDeltaX;
	const y = clientY + dragState.mouseDeltaY;

	const rect = container.getBoundingClientRect();
	const currentMargin = isMobile ? mobileMargin : margin;
	const cellSize = (rect.width - currentMargin * 2) / COLUMNS;

	// Get card dimensions based on current view mode
	const cardW = isMobile ? dragState.item.mobileW : dragState.item.w;
	const cardH = isMobile ? dragState.item.mobileH : dragState.item.h;

	// Get dragged card's original position
	const draggedOrigPos = dragState.originalPositions.get(dragState.item.id);
	const draggedOrigY = draggedOrigPos ? (isMobile ? draggedOrigPos.mobileY : draggedOrigPos.y) : 0;

	// Calculate raw grid position based on top-left of dragged card
	let gridX = clamp(Math.round((x - rect.left - currentMargin) / cellSize), 0, COLUMNS - cardW);
	gridX = Math.floor(gridX / 2) * 2;

	let gridY = Math.max(Math.round((y - rect.top - currentMargin) / cellSize), 0);

	if (isMobile) {
		gridX = Math.floor(gridX / 2) * 2;
		gridY = Math.floor(gridY / 2) * 2;
	}

	// Find if we're hovering over another card (using ORIGINAL positions)
	const centerGridY = gridY + cardH / 2;
	const centerGridX = gridX + cardW / 2;

	let swapWithId: string | null = null;
	let placement: 'above' | 'below' | null = null;

	for (const other of items) {
		if (other === dragState.item) continue;

		// Use original positions for hit testing
		const origPos = dragState.originalPositions.get(other.id);
		if (!origPos) continue;

		const otherX = isMobile ? origPos.mobileX : origPos.x;
		const otherY = isMobile ? origPos.mobileY : origPos.y;
		const otherW = isMobile ? other.mobileW : other.w;
		const otherH = isMobile ? other.mobileH : other.h;

		// Check if dragged card's center point is within this card's original bounds
		if (
			centerGridX >= otherX &&
			centerGridX < otherX + otherW &&
			centerGridY >= otherY &&
			centerGridY < otherY + otherH
		) {
			// Check if this is a swap situation:
			// Cards have the same dimensions and are on the same row
			const canSwap = cardW === otherW && cardH === otherH && draggedOrigY === otherY;

			if (canSwap) {
				// Swap positions
				swapWithId = other.id;
				gridX = otherX;
				gridY = otherY;
				placement = null;

				dragState.lastTargetId = other.id;
				dragState.lastPlacement = null;
			} else {
				// Vertical placement (above/below)
				// Detect drag direction: if dragging up, always place above
				const isDraggingUp = gridY < draggedOrigY;

				if (isDraggingUp) {
					// When dragging up, always place above
					placement = 'above';
				} else {
					// When dragging down, use top/bottom half logic
					const midpointY = otherY + otherH / 2;
					const hysteresis = 0.3;

					if (dragState.lastTargetId === other.id && dragState.lastPlacement) {
						if (dragState.lastPlacement === 'above') {
							placement = centerGridY > midpointY + hysteresis ? 'below' : 'above';
						} else {
							placement = centerGridY < midpointY - hysteresis ? 'above' : 'below';
						}
					} else {
						placement = centerGridY < midpointY ? 'above' : 'below';
					}
				}

				dragState.lastTargetId = other.id;
				dragState.lastPlacement = placement;

				if (placement === 'above') {
					gridY = otherY;
				} else {
					gridY = otherY + otherH;
				}
			}
			break;
		}
	}

	// If we're not over any card, clear the tracking
	if (!swapWithId && !placement) {
		dragState.lastTargetId = null;
		dragState.lastPlacement = null;
	}

	return { x: gridX, y: gridY, swapWithId, placement };
}

/**
 * Get the grid Y coordinate at the viewport center.
 */
export function getViewportCenterGridY(
	container: HTMLElement,
	isMobile: boolean
): { gridY: number; isMobile: boolean } {
	const rect = container.getBoundingClientRect();
	const currentMargin = isMobile ? mobileMargin : margin;
	const cellSize = (rect.width - currentMargin * 2) / COLUMNS;
	const viewportCenterY = window.innerHeight / 2;
	const gridY = (viewportCenterY - rect.top - currentMargin) / cellSize;
	return { gridY, isMobile };
}

/**
 * Convert pixel drop coordinates to grid position. Used for file drops.
 */
export function pixelToGrid(
	clientX: number,
	clientY: number,
	container: HTMLElement,
	isMobile: boolean,
	cardW: number
): { gridX: number; gridY: number } {
	const rect = container.getBoundingClientRect();
	const currentMargin = isMobile ? mobileMargin : margin;
	const cellSize = (rect.width - currentMargin * 2) / COLUMNS;

	let gridX = clamp(
		Math.round((clientX - rect.left - currentMargin) / cellSize),
		0,
		COLUMNS - cardW
	);
	gridX = Math.floor(gridX / 2) * 2;

	let gridY = Math.max(Math.round((clientY - rect.top - currentMargin) / cellSize), 0);
	if (isMobile) {
		gridY = Math.floor(gridY / 2) * 2;
	}

	return { gridX, gridY };
}
