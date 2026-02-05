<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Item } from '$lib/types';
	import { getGridPosition, pixelToGrid, type DragState, type GridPosition } from './grid';
	import { fixCollisions } from './algorithms';

	let {
		items = $bindable(),
		isMobile,
		selectedCardId,
		isCoarse,
		children,
		ref = $bindable<HTMLDivElement | undefined>(undefined),
		onlayoutchange,
		ondeselect,
		onfiledrop
	}: {
		items: Item[];
		isMobile: boolean;
		selectedCardId: string | null;
		isCoarse: boolean;
		children: Snippet;
		ref?: HTMLDivElement | undefined;
		onlayoutchange: () => void;
		ondeselect: () => void;
		onfiledrop?: (files: File[], gridX: number, gridY: number) => void;
	} = $props();

	// Internal container ref (synced with bindable ref)
	let container: HTMLDivElement | undefined = $state();
	$effect(() => {
		ref = container;
	});

	const getY = (item: Item) => (isMobile ? (item.mobileY ?? item.y) : item.y);
	const getH = (item: Item) => (isMobile ? (item.mobileH ?? item.h) : item.h);
	let maxHeight = $derived(items.reduce((max, item) => Math.max(max, getY(item) + getH(item)), 0));

	// --- Drag state ---
	type Phase = 'idle' | 'pending' | 'active';

	let phase: Phase = $state('idle');
	let pointerId: number = $state(0);
	let startClientX = $state(0);
	let startClientY = $state(0);

	let dragState: DragState = $state({
		item: null as unknown as Item,
		mouseDeltaX: 0,
		mouseDeltaY: 0,
		originalPositions: new Map(),
		lastTargetId: null,
		lastPlacement: null
	});

	let lastGridPos: GridPosition | null = $state(null);

	// Ref to the dragged card DOM element (for visual feedback)
	let draggedCardEl: HTMLElement | null = null;

	// --- File drag state ---
	let fileDragOver = $state(false);

	// --- Pointer event handlers ---

	function handlePointerDown(e: PointerEvent) {
		if (phase !== 'idle') return;

		const cardEl = (e.target as HTMLElement)?.closest?.('.card') as HTMLDivElement | null;
		if (!cardEl) return;

		// On touch devices, only drag the selected card
		if (e.pointerType === 'touch' && cardEl.id !== selectedCardId) return;

		// On mouse, don't intercept interactive elements
		if (e.pointerType === 'mouse') {
			const tag = (e.target as HTMLElement)?.tagName;
			if (
				tag === 'BUTTON' ||
				tag === 'INPUT' ||
				tag === 'TEXTAREA' ||
				(e.target as HTMLElement)?.isContentEditable
			) {
				return;
			}
		}

		const item = items.find((i) => i.id === cardEl.id);
		if (!item || item.cardData?.locked) return;

		phase = 'pending';
		pointerId = e.pointerId;
		startClientX = e.clientX;
		startClientY = e.clientY;
		draggedCardEl = cardEl;

		// Pre-compute mouse delta from card rect
		const rect = cardEl.getBoundingClientRect();
		dragState.item = item;
		dragState.mouseDeltaX = rect.left - e.clientX;
		dragState.mouseDeltaY = rect.top - e.clientY;

		document.addEventListener('pointermove', handlePointerMove);
		document.addEventListener('pointerup', handlePointerUp);
		document.addEventListener('pointercancel', handlePointerCancel);
	}

	function activateDrag(e: PointerEvent) {
		phase = 'active';

		try {
			(e.target as HTMLElement)?.setPointerCapture?.(pointerId);
		} catch {
			// setPointerCapture can throw if pointer is already released
		}

		// Visual feedback: lift the dragged card
		draggedCardEl?.classList.add('dragging');

		// Store original positions of all items
		dragState.originalPositions = new Map();
		for (const it of items) {
			dragState.originalPositions.set(it.id, {
				x: it.x,
				y: it.y,
				mobileX: it.mobileX,
				mobileY: it.mobileY
			});
		}
		dragState.lastTargetId = null;
		dragState.lastPlacement = null;

		document.body.style.userSelect = 'none';
	}

	function handlePointerMove(e: PointerEvent) {
		if (!container) return;

		if (phase === 'pending') {
			// Check 3px threshold
			const dx = e.clientX - startClientX;
			const dy = e.clientY - startClientY;
			if (dx * dx + dy * dy < 9) return;
			activateDrag(e);
		}

		if (phase !== 'active') return;

		// Auto-scroll near edges
		const scrollZone = 100;
		const scrollSpeed = 10;
		const viewportHeight = window.innerHeight;

		if (e.clientY < scrollZone) {
			const intensity = 1 - e.clientY / scrollZone;
			window.scrollBy(0, -scrollSpeed * intensity);
		} else if (e.clientY > viewportHeight - scrollZone) {
			const intensity = 1 - (viewportHeight - e.clientY) / scrollZone;
			window.scrollBy(0, scrollSpeed * intensity);
		}

		const result = getGridPosition(e.clientX, e.clientY, container, dragState, items, isMobile);
		if (!result || !dragState.item) return;

		// Skip redundant work if grid position hasn't changed
		if (
			lastGridPos &&
			lastGridPos.x === result.x &&
			lastGridPos.y === result.y &&
			lastGridPos.swapWithId === result.swapWithId &&
			lastGridPos.placement === result.placement
		) {
			return;
		}
		lastGridPos = result;

		const draggedOrigPos = dragState.originalPositions.get(dragState.item.id);

		// Reset all items to original positions first
		for (const it of items) {
			const origPos = dragState.originalPositions.get(it.id);
			if (origPos && it !== dragState.item) {
				if (isMobile) {
					it.mobileX = origPos.mobileX;
					it.mobileY = origPos.mobileY;
				} else {
					it.x = origPos.x;
					it.y = origPos.y;
				}
			}
		}

		// Update dragged item position
		if (isMobile) {
			dragState.item.mobileX = result.x;
			dragState.item.mobileY = result.y;
		} else {
			dragState.item.x = result.x;
			dragState.item.y = result.y;
		}

		// Handle horizontal swap
		if (result.swapWithId && draggedOrigPos) {
			const swapTarget = items.find((it) => it.id === result.swapWithId);
			if (swapTarget) {
				if (isMobile) {
					swapTarget.mobileX = draggedOrigPos.mobileX;
					swapTarget.mobileY = draggedOrigPos.mobileY;
				} else {
					swapTarget.x = draggedOrigPos.x;
					swapTarget.y = draggedOrigPos.y;
				}
			}
		}

		fixCollisions(
			items,
			dragState.item,
			isMobile,
			false,
			draggedOrigPos
				? {
						x: isMobile ? draggedOrigPos.mobileX : draggedOrigPos.x,
						y: isMobile ? draggedOrigPos.mobileY : draggedOrigPos.y
					}
				: undefined
		);
	}

	function handlePointerUp() {
		if (phase === 'active' && dragState.item) {
			fixCollisions(items, dragState.item, isMobile);
			onlayoutchange();
		}
		cleanup();
	}

	function handlePointerCancel() {
		if (phase === 'active') {
			// Restore all items to original positions
			for (const it of items) {
				const origPos = dragState.originalPositions.get(it.id);
				if (origPos) {
					it.x = origPos.x;
					it.y = origPos.y;
					it.mobileX = origPos.mobileX;
					it.mobileY = origPos.mobileY;
				}
			}
		}
		cleanup();
	}

	function cleanup() {
		draggedCardEl?.classList.remove('dragging');
		draggedCardEl = null;
		phase = 'idle';
		lastGridPos = null;
		document.body.style.userSelect = '';

		document.removeEventListener('pointermove', handlePointerMove);
		document.removeEventListener('pointerup', handlePointerUp);
		document.removeEventListener('pointercancel', handlePointerCancel);
	}

	// Ensure cleanup on unmount
	$effect(() => {
		return () => {
			if (phase !== 'idle') cleanup();
		};
	});

	// For touch: register non-passive touchstart to prevent scroll when touching selected card
	$effect(() => {
		if (!container || !selectedCardId) return;
		container.addEventListener('touchstart', handleTouchStart, { passive: false });
		return () => {
			container?.removeEventListener('touchstart', handleTouchStart);
		};
	});

	// For touch: register non-passive touchmove to prevent scroll during active drag
	$effect(() => {
		if (phase !== 'active' || !container) return;
		function preventTouch(e: TouchEvent) {
			e.preventDefault();
		}
		container.addEventListener('touchmove', preventTouch, { passive: false });
		return () => {
			container?.removeEventListener('touchmove', preventTouch);
		};
	});

	function handleClick(e: MouseEvent) {
		// Deselect when tapping empty grid space
		if (e.target === e.currentTarget || !(e.target as HTMLElement)?.closest?.('.card')) {
			ondeselect();
		}
	}

	function handleTouchStart(e: TouchEvent) {
		// On touch, prevent scrolling when touching the selected card
		// This must happen on touchstart (not pointerdown) to claim the gesture
		const cardEl = (e.target as HTMLElement)?.closest?.('.card') as HTMLElement | null;
		if (cardEl && cardEl.id === selectedCardId) {
			const item = items.find((i) => i.id === cardEl.id);
			if (item && !item.cardData?.locked) {
				e.preventDefault();
			}
		}
	}

	// --- File drop handlers ---

	function hasImageFile(dt: DataTransfer): boolean {
		if (dt.items) {
			for (let i = 0; i < dt.items.length; i++) {
				const item = dt.items[i];
				if (item && item.kind === 'file' && item.type.startsWith('image/')) {
					return true;
				}
			}
		} else if (dt.files) {
			for (let i = 0; i < dt.files.length; i++) {
				const file = dt.files[i];
				if (file?.type.startsWith('image/')) {
					return true;
				}
			}
		}
		return false;
	}

	function handleFileDragOver(event: DragEvent) {
		const dt = event.dataTransfer;
		if (!dt) return;

		if (hasImageFile(dt)) {
			event.preventDefault();
			event.stopPropagation();
			fileDragOver = true;
		}
	}

	function handleFileDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		fileDragOver = false;
	}

	function handleFileDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		fileDragOver = false;

		if (!event.dataTransfer?.files?.length || !onfiledrop || !container) return;

		const imageFiles = Array.from(event.dataTransfer.files).filter((f) =>
			f?.type.startsWith('image/')
		);
		if (imageFiles.length === 0) return;

		const cardW = isMobile ? 4 : 2;
		const { gridX, gridY } = pixelToGrid(event.clientX, event.clientY, container, isMobile, cardW);

		onfiledrop(imageFiles, gridX, gridY);
	}
</script>

<svelte:window
	ondragover={handleFileDragOver}
	ondragleave={handleFileDragLeave}
	ondrop={handleFileDrop}
/>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div
	bind:this={container}
	onpointerdown={handlePointerDown}
	onclick={handleClick}
	ondragstart={(e) => e.preventDefault()}
	class={[
		'@container/grid pointer-events-auto relative col-span-3 rounded-4xl px-2 py-8 @5xl/wrapper:px-8',
		fileDragOver && 'outline-accent-500 outline-3 -outline-offset-10 outline-dashed'
	]}
>
	{@render children()}

	<div style="height: {((maxHeight + 2) / 8) * 100}cqw;"></div>
</div>

<style>
	:global(.card.dragging) {
		z-index: 50 !important;
		scale: 1.03;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}
</style>
