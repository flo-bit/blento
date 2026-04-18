<script lang="ts">
	import type { Item } from '$lib/types';
	import type { EditingSectionContentProps } from '../types';
	import { EditableGrid, fixCollisions, compactItems, setPositionOfNewItem } from '$lib/layout';
	import GridBaseEditingCard from '$lib/cards/_base/BaseCard/GridBaseEditingCard.svelte';
	import EditingCard from '$lib/cards/_base/Card/EditingCard.svelte';
	import SectionChrome from '../SectionChrome.svelte';
	import { GRID_SECTION_ICON, GRID_SECTION_NAME } from './shared';
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
	<SectionChrome
		{isActive}
		{hovered}
		name={section.name || GRID_SECTION_NAME}
		icon={GRID_SECTION_ICON}
	/>

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
