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
	let touchActive = false;

	// Prevent iOS link preview on long-press
	const originalCallout = node.style.getPropertyValue('-webkit-touch-callout');
	node.style.setProperty('-webkit-touch-callout', 'none');

	function getHref() {
		return params.href || (node as HTMLAnchorElement).href || '';
	}

	function startLongPress(e: PointerEvent) {
		if (params.disabled) return;
		// Only start long press for primary button (touch/left-click), not right-click
		if (e.button !== 0) return;
		touchActive = e.pointerType === 'touch';
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
		touchActive = false;
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

	function handleContextMenu(e: Event) {
		// Prevent context menu during touch to avoid iOS preview
		if (touchActive || isLongPress) {
			e.preventDefault();
		}
	}

	node.addEventListener('pointerdown', startLongPress);
	node.addEventListener('pointerup', cancelLongPress);
	node.addEventListener('pointercancel', cancelLongPress);
	node.addEventListener('pointerleave', cancelLongPress);
	node.addEventListener('click', handleClick);
	node.addEventListener('contextmenu', handleContextMenu);

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
			node.removeEventListener('contextmenu', handleContextMenu);
			cancelLongPress();
			// Restore original style
			if (originalCallout) {
				node.style.setProperty('-webkit-touch-callout', originalCallout);
			} else {
				node.style.removeProperty('-webkit-touch-callout');
			}
		}
	};
}
