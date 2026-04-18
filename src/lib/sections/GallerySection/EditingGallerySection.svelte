<script lang="ts">
	import { ImageMasonry } from '@foxui/visual';
	import { Button } from '@foxui/core';
	import { getDidContext, getSelectCard } from '$lib/website/context';
	import { getImage } from '$lib/helper';
	import type { EditingSectionContentProps } from '../types';
	import SectionChrome from '../SectionChrome.svelte';

	let {
		section,
		items = $bindable(),
		isActive,
		onlayoutchange,
		oncreatefilecards,
		onactivate,
		onrefchange
	}: EditingSectionContentProps = $props();

	let d = $derived(section.sectionData);
	let columns = $derived(Math.max(1, Math.min(6, (d.columns ?? 3) as number)));

	const did = getDidContext();
	const selectCard = getSelectCard();

	let sectionItems = $derived(
		items.filter((i) => i.sectionId === section.id).toSorted((a, b) => a.x - b.x)
	);

	let images = $derived(
		sectionItems
			.map((item) => {
				const src = getImage(item.cardData, did, 'image');
				if (!src) return null;
				const ar = item.cardData.aspectRatio as { width: number; height: number } | undefined;
				const width = ar?.width || item.w || 1;
				const height = ar?.height || item.h || 1;
				return {
					src,
					name: '',
					width,
					height,
					onclick: () => selectCard(item.id)
				};
			})
			.filter((i) => i !== null)
	);

	let containerRef: HTMLDivElement | undefined = $state();
	let hovered = $state(false);

	$effect(() => {
		onrefchange(containerRef);
		return () => onrefchange(undefined);
	});

	$effect(() => {
		const el = containerRef;
		if (!el) return;
		const enter = () => (hovered = true);
		const leave = () => (hovered = false);
		const down = () => onactivate();
		el.addEventListener('pointerenter', enter);
		el.addEventListener('pointerleave', leave);
		el.addEventListener('pointerdown', down);
		return () => {
			el.removeEventListener('pointerenter', enter);
			el.removeEventListener('pointerleave', leave);
			el.removeEventListener('pointerdown', down);
		};
	});

	const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;

	let fileInput: HTMLInputElement | undefined = $state();

	async function handleFiles(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length < 1) return;
		const files = Array.from(input.files).filter((f) => f.type.startsWith('image/'));
		const cards = await oncreatefilecards(files);
		for (const card of cards) {
			card.sectionId = section.id;
			card.w = 2;
			card.h = 2;
			card.mobileW = 4;
			card.mobileH = 4;
			const current = items.filter((i) => i.sectionId === section.id);
			card.x = current.length;
			card.y = 0;
			items = [...items, card];
		}
		onlayoutchange();
		input.value = '';
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept="image/*"
	multiple
	class="hidden"
	onchange={handleFiles}
/>

<div
	bind:this={containerRef}
	class="@container/grid pointer-events-auto relative col-span-3 px-2 py-8"
>
	<SectionChrome {isActive} {hovered} name={section.name || 'Gallery'} {icon} />

	{#if sectionItems.length > 0}
		<div class="gallery-compact">
			<ImageMasonry {images} showNames={false} maxColumns={2} />
		</div>
		<div class="gallery-wide">
			<ImageMasonry {images} showNames={false} maxColumns={columns} />
		</div>
	{/if}

	<div class="mt-4 flex justify-center">
		<Button variant="ghost" onclick={() => fileInput?.click()} class="gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-4"
			>
				<path d="M12 5v14" />
				<path d="M5 12h14" />
			</svg>
			Add images
		</Button>
	</div>
</div>

<style>
	.gallery-wide {
		display: none;
	}
	@container grid (width >= 42rem) {
		.gallery-compact {
			display: none;
		}
		.gallery-wide {
			display: block;
		}
	}
</style>
