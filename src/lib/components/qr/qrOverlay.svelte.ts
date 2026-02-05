import type { QRContext } from './QRCodeModal.svelte';

// Global state for QR modal
let openModal: ((href: string, context: QRContext) => void) | null = null;

export function registerQRModal(fn: (href: string, context: QRContext) => void) {
	openModal = fn;
}

export function unregisterQRModal() {
	openModal = null;
}

export function qrOverlay(
	node: HTMLElement,
	params: { href?: string; context?: QRContext; disabled?: boolean } = {}
) {
	const LONG_PRESS_DURATION = 500;
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	let isLongPress = false;

	function getHref() {
		return params.href || (node as HTMLAnchorElement).href || '';
	}

	function startLongPress(e: PointerEvent) {
		if (params.disabled) return;
		// Only start long press for primary button (touch/left-click), not right-click
		if (e.button !== 0) return;
		isLongPress = false;
		longPressTimer = setTimeout(() => {
			isLongPress = true;
			openModal?.(getHref(), params.context ?? {});
		}, LONG_PRESS_DURATION);
	}

	function cancelLongPress() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	function handleClick(e: MouseEvent) {
		if (isLongPress) {
			e.preventDefault();
			isLongPress = false;
			return;
		}

		// Shift-click opens QR modal
		if (e.shiftKey && !params.disabled) {
			e.preventDefault();
			openModal?.(getHref(), params.context ?? {});
		}
	}

	node.addEventListener('pointerdown', startLongPress);
	node.addEventListener('pointerup', cancelLongPress);
	node.addEventListener('pointercancel', cancelLongPress);
	node.addEventListener('pointerleave', cancelLongPress);
	node.addEventListener('click', handleClick);

	return {
		update(newParams: { href?: string; context?: QRContext; disabled?: boolean }) {
			params = newParams;
		},
		destroy() {
			node.removeEventListener('pointerdown', startLongPress);
			node.removeEventListener('pointerup', cancelLongPress);
			node.removeEventListener('pointercancel', cancelLongPress);
			node.removeEventListener('pointerleave', cancelLongPress);
			node.removeEventListener('click', handleClick);
			cancelLongPress();
		}
	};
}
