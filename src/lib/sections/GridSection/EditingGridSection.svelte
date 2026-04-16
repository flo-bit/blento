<script lang="ts">
	import type { Item } from '$lib/types';
	import type { EditingSectionContentProps } from '../types';
	import { EditableGrid, fixCollisions, compactItems, setPositionOfNewItem } from '$lib/layout';
	import GridBaseEditingCard from '$lib/cards/_base/BaseCard/GridBaseEditingCard.svelte';
	import EditingCard from '$lib/cards/_base/Card/EditingCard.svelte';
	import { SectionDefinitionsByType } from '$lib/sections';
	import { SECTIONS_EDITING_ENABLED } from '$lib/sections/feature-flag';
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
		onrequestaddcard,
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
	{#if SECTIONS_EDITING_ENABLED && (hovered || isActive)}
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
			<button
				type="button"
				class="text-base-400 dark:text-base-500 hover:text-accent-500 flex cursor-pointer items-center gap-2 text-sm transition-colors"
				onclick={() => onrequestaddcard()}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="size-4"><path d="M12 5v14" /><path d="M5 12h14" /></svg
				>
				Add a card
			</button>
		</div>
	{/if}

	{#each sectionItems as item (item.id)}
		{@const idx = items.indexOf(item)}
		<GridBaseEditingCard
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
		</GridBaseEditingCard>
	{/each}
</EditableGrid>
