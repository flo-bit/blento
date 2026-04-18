<script lang="ts">
	import type { DecorationSlot } from './shared';
	import type { Item } from '$lib/types';
	import Card from '$lib/cards/_base/Card/Card.svelte';
	import EditingCard from '$lib/cards/_base/Card/EditingCard.svelte';
	import BaseCard from '$lib/cards/_base/BaseCard/BaseCard.svelte';
	import BaseEditingCard from '$lib/cards/_base/BaseCard/BaseEditingCard.svelte';
	import { getSelectedCardId } from '$lib/website/context';

	let {
		slot,
		item = $bindable(),
		isEditing = false,
		ondelete,
		onclick
	}: {
		slot: DecorationSlot;
		item?: Item;
		isEditing?: boolean;
		ondelete?: () => void;
		onclick?: () => void;
	} = $props();

	const selectedCardId = getSelectedCardId();
	let isSelected = $derived(!!item && selectedCardId?.() === item.id);

	let rotation = $derived(item?.rotation ?? slot.rotation ?? 0);

	const sideStyle = $derived(
		slot.side === 'left'
			? `left: 0; transform: translate(calc(-1 * var(--tx)), -50%) rotate(${rotation}deg);`
			: `right: 0; transform: translate(var(--tx), -50%) rotate(${rotation}deg);`
	);
</script>

{#if item && isEditing}
	<div
		class={[
			'deco absolute block w-36 text-left transition-all @[42rem]/grid:w-40',
			isSelected ? 'z-20' : 'z-0'
		]}
		style="top: {(slot.top ?? 50) + '%'}; {sideStyle}"
	>
		<div class="aspect-square w-full">
			<BaseEditingCard bind:item ondelete={() => ondelete?.()} showGridControls={false}>
				<EditingCard bind:item />
			</BaseEditingCard>
		</div>
	</div>
{:else if item}
	<div
		class="deco absolute z-0 block w-36 overflow-hidden rounded-3xl shadow-2xl @[42rem]/grid:w-40"
		style="top: {(slot.top ?? 50) + '%'}; {sideStyle}"
	>
		<div class="pointer-events-none aspect-square w-full overflow-hidden rounded-3xl">
			<BaseCard {item}>
				<Card {item} />
			</BaseCard>
		</div>
	</div>
{:else if isEditing}
	<button
		type="button"
		class="deco border-base-400/60 dark:border-base-500/60 hover:border-accent-500 hover:bg-accent-500/10 text-base-500 dark:text-base-400 hover:text-accent-600 dark:hover:text-accent-400 pointer-events-auto absolute z-0 flex aspect-square w-36 cursor-pointer flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed bg-white/40 opacity-40 backdrop-blur-sm transition-all duration-150 group-hover/hero:opacity-100 hover:scale-[1.03] hover:opacity-100 @[42rem]/grid:w-40 dark:bg-black/20"
		style="top: {(slot.top ?? 50) + '%'}; {sideStyle}"
		{onclick}
		aria-label="Add card"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="size-6"
		>
			<path d="M12 5v14" />
			<path d="M5 12h14" />
		</svg>
		<span class="text-xs font-medium">Add card</span>
	</button>
{/if}

<style>
	.deco {
		--tx: 65%;
	}
	@container grid (width >= 42rem) {
		.deco {
			--tx: 55%;
		}
	}
</style>
