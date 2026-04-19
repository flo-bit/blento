<script lang="ts">
	import type { SectionContentProps } from '../types';
	import GridBaseCard from '$lib/cards/_base/BaseCard/GridBaseCard.svelte';
	import Card from '$lib/cards/_base/Card/Card.svelte';
	import { sortItems } from '$lib/helper';

	let { section, items, isMobile }: SectionContentProps = $props();

	let maxHeight = $derived(
		items.reduce(
			(max, item) => Math.max(max, isMobile ? item.mobileY + item.mobileH : item.y + item.h),
			0
		)
	);
</script>

<div class="@container/grid relative col-span-3 px-2 pt-4 pb-8 lg:px-8 lg:pt-8">
	{#each items.toSorted(sortItems) as item (item.id)}
		<GridBaseCard {item}>
			<Card {item} />
		</GridBaseCard>
	{/each}
	<div style="height: {(maxHeight / 8) * 100}cqw;"></div>
</div>
