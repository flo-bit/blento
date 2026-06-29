<script lang="ts">
	import BaseCard from '$lib/cards/_base/BaseCard/BaseCard.svelte';
	import Card from '$lib/cards/_base/Card/Card.svelte';
	import type { SectionContentProps } from '../types';
	import { rowItemStyle } from './shared';

	let { section, items }: SectionContentProps = $props();

	let sectionItems = $derived(
		items.filter((i) => i.sectionId === section.id).toSorted((a, b) => a.y - b.y)
	);
</script>

<div class="@container/grid relative col-span-3 px-2 py-8">
	<div class="flex flex-col gap-4">
		{#each sectionItems as item (item.id)}
			<div class="w-full" style={rowItemStyle(item)}>
				<BaseCard {item}>
					<Card {item} />
				</BaseCard>
			</div>
		{/each}
	</div>
</div>
