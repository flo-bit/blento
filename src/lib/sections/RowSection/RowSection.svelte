<script lang="ts">
	import BaseCard from '$lib/cards/_base/BaseCard/BaseCard.svelte';
	import Card from '$lib/cards/_base/Card/Card.svelte';
	import type { SectionContentProps } from '../types';

	let { section, items }: SectionContentProps = $props();

	let sectionItems = $derived(
		items.filter((i) => i.sectionId === section.id).toSorted((a, b) => a.x - b.x)
	);
</script>

<div class="@container/grid relative col-span-3 px-0 py-8">
	<div class="overflow-x-auto">
		<div class="flex gap-4 px-2">
			{#each sectionItems as item (item.id)}
				<div
					class="aspect-square w-40 flex-shrink-0 sm:w-48"
					style={item.rotation ? `transform: rotate(${item.rotation}deg);` : ''}
				>
					<BaseCard {item}>
						<Card {item} />
					</BaseCard>
				</div>
			{/each}
		</div>
	</div>
</div>
