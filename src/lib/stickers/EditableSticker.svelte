<script lang="ts">
	import type { Sticker } from './types';
	import { getImage } from '$lib/helper';
	import { getDidContext } from '$lib/website/context';
	import { createDraggable } from 'animejs';
	import { onMount } from 'svelte';

	let {
		sticker = $bindable(),
		selected = false,
		containerRef,
		onselect,
		ondelete,
		onchange
	}: {
		sticker: Sticker;
		selected?: boolean;
		containerRef?: HTMLDivElement;
		onselect?: () => void;
		ondelete?: () => void;
		onchange?: () => void;
	} = $props();

	const did = getDidContext();

	let imageUrl = $derived(sticker.type === 'image' ? getImage(sticker, did, 'image') : undefined);

	// anime.js drags this outermost element — everything inside moves with it
	let dragEl: HTMLDivElement | undefined = $state();
	let triggerEl: HTMLDivElement | undefined = $state();
	let draggable: ReturnType<typeof createDraggable> | undefined;

	onMount(() => {
		if (!dragEl || !triggerEl) return;

		draggable = createDraggable(dragEl, {
			trigger: triggerEl,
			releaseStiffness: 20,
			releaseDamping: 0.85,
			releaseMass: 1.5,
			releaseEase: 'out(3)',
			scrollSpeed: 0,
			scrollThreshold: 0,
			onGrab: () => {
				onselect?.();
			},
			onSettle: (d: any) => {
				if (!containerRef) return;
				const rect = containerRef.getBoundingClientRect();
				sticker.x = Math.round(sticker.x + (d.x / rect.width) * 10000);
				sticker.y = Math.round(sticker.y + (d.y / rect.height) * 10000);
				d.setX(0);
				d.setY(0);
				onchange?.();
			}
		});

		return () => {
			draggable?.revert();
		};
	});

	function getStickerCenter(): { cx: number; cy: number } | undefined {
		if (!dragEl) return;
		const rect = dragEl.getBoundingClientRect();
		return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
	}

	function onRotateScalePointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();

		const center = getStickerCenter();
		if (!center) return;

		const startAngle = Math.atan2(e.clientY - center.cy, e.clientX - center.cx);
		const startDist = Math.hypot(e.clientX - center.cx, e.clientY - center.cy);
		const startRotation = sticker.rotation;
		const startScale = sticker.scale;

		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);

		function onpointermove(ev: PointerEvent) {
			const c = getStickerCenter();
			if (!c) return;

			const angle = Math.atan2(ev.clientY - c.cy, ev.clientX - c.cx);
			const dist = Math.hypot(ev.clientX - c.cx, ev.clientY - c.cy);

			let angleDelta = ((angle - startAngle) * 180) / Math.PI;
			sticker.rotation = Math.round(((startRotation + angleDelta + 540) % 360) - 180);

			if (startDist > 5) {
				sticker.scale = Math.round(Math.max(25, Math.min(300, startScale * (dist / startDist))));
			}
		}

		function onpointerup() {
			target.removeEventListener('pointermove', onpointermove);
			target.removeEventListener('pointerup', onpointerup);
			onchange?.();
		}

		target.addEventListener('pointermove', onpointermove);
		target.addEventListener('pointerup', onpointerup);
	}
</script>

<!-- Outer: positioned via left/top. anime.js adds transform:translate() for drag offset.
     Everything (sticker visual + handles) lives inside so it all moves together. -->
<div
	bind:this={dragEl}
	class="group pointer-events-auto absolute"
	style="left: calc(50% + {sticker.x / 100}%); top: {sticker.y / 100}%; z-index: {selected
		? 50
		: 41};"
>
	<div
		style="transform: translate(-50%, -50%) rotate({sticker.rotation}deg) scale({sticker.scale /
			100});"
	>
		<div class="relative">
			<div bind:this={triggerEl} class="cursor-grab">
				{#if sticker.type === 'emoji'}
					<span class="text-4xl select-none">{sticker.emoji}</span>
				{:else if sticker.type === 'image' && imageUrl}
					<img src={imageUrl} alt="sticker" class="h-16 w-16 object-contain" draggable="false" />
				{/if}
			</div>

			<button
				aria-label="Delete sticker"
				class="bg-base-100 dark:bg-base-800 pointer-events-auto absolute -top-3 -left-3 flex size-6 cursor-pointer items-center justify-center rounded-full opacity-0 shadow transition-opacity group-hover:opacity-100"
				style="transform: rotate({-sticker.rotation}deg) scale({100 / sticker.scale});"
				onclick={(e) => {
					e.stopPropagation();
					ondelete?.();
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="size-3.5 text-rose-500"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>

			<div
				class="bg-accent-500 pointer-events-auto absolute -right-3 -bottom-3 flex size-6 cursor-grab items-center justify-center rounded-full opacity-0 shadow transition-opacity group-hover:opacity-100"
				style="transform: rotate({-sticker.rotation}deg) scale({100 / sticker.scale});"
				onpointerdown={onRotateScalePointerDown}
				role="slider"
				aria-label="Rotate and scale sticker"
				aria-valuenow={sticker.rotation}
				tabindex="0"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="size-3.5 text-white"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
					/>
				</svg>
			</div>
		</div>
	</div>
</div>
