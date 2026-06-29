<script lang="ts">
	import BaseEditingCard from '$lib/cards/_base/BaseCard/BaseEditingCard.svelte';
	import EditingCard from '$lib/cards/_base/Card/EditingCard.svelte';
	import type { EditingSectionContentProps } from '../types';
	import SectionChrome from '../SectionChrome.svelte';
	import { singleCardAspectStyle } from './shared';

	let {
		section,
		items = $bindable(),
		isActive,
		onlayoutchange,
		onrequestaddcard,
		onactivate,
		onrefchange
	}: EditingSectionContentProps = $props();

	let card = $derived(items.find((i) => i.sectionId === section.id));
	let aspect = $derived((section.sectionData?.aspect as string) ?? 'fit');

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

	function clearCard() {
		items = items.filter((i) => i.sectionId !== section.id);
		onlayoutchange();
	}

	const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`;
</script>

<div
	bind:this={containerRef}
	class="@container/grid pointer-events-auto relative col-span-3 px-2 py-4"
>
	<SectionChrome
		sectionId={section.id}
		{isActive}
		{hovered}
		name={section.name || 'Single card'}
		{icon}
	/>

	<div class="pt-4 pb-14">
		{#if card}
			{@const idx = items.indexOf(card)}
			<div class="w-full" style={singleCardAspectStyle(card, aspect)}>
				<BaseEditingCard bind:item={items[idx]} ondelete={clearCard} showGridControls={false}>
					<EditingCard bind:item={items[idx]} />
				</BaseEditingCard>
			</div>
		{:else}
			<button
				type="button"
				class="border-base-400/60 dark:border-base-500/60 hover:border-accent-500 hover:bg-accent-500/10 text-base-500 dark:text-base-400 hover:text-accent-600 dark:hover:text-accent-400 flex min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed transition-all duration-150"
				onclick={() => onrequestaddcard()}
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
	</div>
</div>
