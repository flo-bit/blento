<script lang="ts">
	import type { EditingSectionContentProps } from '../types';
	import { EditableGrid, fixCollisions, compactItems, setPositionOfNewItem } from '$lib/layout';
	import BaseEditingCard from '$lib/cards/_base/BaseCard/BaseEditingCard.svelte';
	import EditingCard from '$lib/cards/_base/Card/EditingCard.svelte';
	import { SectionDefinitionsByType } from '$lib/sections';
	import { positionItemAtGridPos } from './add-item';

	let {
		section,
		items = $bindable(),
		isMobile,
		selectedCardId,
		isCoarse,
		isActive,
		onlayoutchange,
		ondeselect,
		onadditem,
		oncreatefilecards,
		onactivate,
		onrefchange
	}: EditingSectionContentProps = $props();

	let gridRef: HTMLDivElement | undefined = $state();

	let sectionItems = $derived(items.filter((i) => i.sectionId === section.id));

	let hovered = $state(false);
	const def = $derived(SectionDefinitionsByType[section.sectionType]);

	$effect(() => {
		onrefchange(gridRef);
		return () => onrefchange(undefined);
	});

	$effect(() => {
		const el = gridRef;
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

	async function handleFileDrop(files: File[], gridX: number, gridY: number) {
		const cards = await oncreatefilecards(files);
		for (let i = 0; i < cards.length; i++) {
			const card = cards[i];
			card.sectionId = section.id;
			if (i === 0) {
				positionItemAtGridPos(card, gridX, gridY, isMobile);
			} else {
				const currentSectionItems = items.filter((it) => it.sectionId === section.id);
				setPositionOfNewItem(card, currentSectionItems);
			}

			items = [...items, card];
			const updatedSectionItems = items.filter((it) => it.sectionId === section.id);
			fixCollisions(updatedSectionItems, card, isMobile);
			fixCollisions(updatedSectionItems, card, !isMobile);
		}
		onlayoutchange();
	}
</script>

<EditableGrid
	items={sectionItems}
	bind:ref={gridRef}
	{isMobile}
	{selectedCardId}
	{isCoarse}
	{onlayoutchange}
	{ondeselect}
	onfiledrop={handleFileDrop}
>
	{#if hovered || isActive}
		<div
			class="pointer-events-none absolute inset-0 z-30 rounded-3xl border-2 border-dashed transition-colors duration-150 {isActive
				? 'border-accent-500/50'
				: 'border-base-400/30 dark:border-base-500/30'}"
		>
			<div
				class="bg-base-100/80 dark:bg-base-900/80 absolute -top-3 left-4 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm {isActive
					? 'text-accent-600 dark:text-accent-400'
					: 'text-base-500 dark:text-base-400'}"
			>
				{#if def?.icon}
					<span class="[&_svg]:size-3">{@html def.icon}</span>
				{/if}
				{section.name || def?.name || section.sectionType}
			</div>
		</div>
	{/if}

	{#if sectionItems.length === 0}
		<div
			class="border-base-300/50 dark:border-base-700/50 pointer-events-auto relative flex min-h-32 items-center justify-center rounded-3xl border-2 border-dashed"
		>
			<p class="text-base-400 dark:text-base-500 text-sm">
				Click the + button to add cards to this section
			</p>
		</div>
	{/if}

	{#each sectionItems as item (item.id)}
		{@const idx = items.indexOf(item)}
		<BaseEditingCard
			bind:item={items[idx]}
			ondelete={() => {
				items = items.filter((it) => it !== item);
				compactItems(
					items.filter((i) => i.sectionId === section.id),
					false
				);
				compactItems(
					items.filter((i) => i.sectionId === section.id),
					true
				);
				onlayoutchange();
			}}
			onsetsize={(newW, newH) => {
				if (isMobile) {
					item.mobileW = newW;
					item.mobileH = newH;
				} else {
					item.w = newW;
					item.h = newH;
				}
				fixCollisions(
					items.filter((i) => i.sectionId === section.id),
					item,
					isMobile
				);
				onlayoutchange();
			}}
		>
			<EditingCard bind:item={items[idx]} />
		</BaseEditingCard>
	{/each}
</EditableGrid>
