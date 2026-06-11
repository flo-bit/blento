<script lang="ts">
	import BaseEditingCard from '$lib/cards/_base/BaseCard/BaseEditingCard.svelte';
	import EditingCard from '$lib/cards/_base/Card/EditingCard.svelte';
	import type { EditingSectionContentProps } from '../types';
	import SectionChrome from '../SectionChrome.svelte';
	import { rowItemStyle } from './shared';

	let {
		section,
		items = $bindable(),
		isActive,
		onlayoutchange,
		onrequestaddcard,
		onactivate,
		onrefchange
	}: EditingSectionContentProps = $props();

	let sectionItems = $derived(
		items.filter((i) => i.sectionId === section.id).toSorted((a, b) => a.y - b.y)
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

	function deleteItem(id: string) {
		items = items.filter((i) => i.id !== id);
		onlayoutchange();
	}

	const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="5" width="18" height="4" rx="1"/><rect x="3" y="15" width="18" height="4" rx="1"/></svg>`;
</script>

<div
	bind:this={containerRef}
	class="@container/grid pointer-events-auto relative col-span-3 px-2 py-4"
>
	<SectionChrome sectionId={section.id} {isActive} {hovered} name={section.name || 'Rows'} {icon} />

	<div class="flex flex-col gap-4 pt-4 pb-14">
		{#each sectionItems as item (item.id)}
			{@const idx = items.indexOf(item)}
			<div class="w-full" style={rowItemStyle(item)}>
				<BaseEditingCard
					bind:item={items[idx]}
					ondelete={() => deleteItem(item.id)}
					showGridControls={false}
				>
					<EditingCard bind:item={items[idx]} />
				</BaseEditingCard>
			</div>
		{/each}

		<button
			type="button"
			class="border-base-400/60 dark:border-base-500/60 hover:border-accent-500 hover:bg-accent-500/10 text-base-500 dark:text-base-400 hover:text-accent-600 dark:hover:text-accent-400 flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed transition-all duration-150"
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
	</div>
</div>
