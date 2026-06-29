<script lang="ts">
	import BaseCard from '$lib/cards/_base/BaseCard/BaseCard.svelte';
	import Card from '$lib/cards/_base/Card/Card.svelte';
	import type { SectionContentProps } from '../types';
	import { singleCardAspectStyle } from './shared';

	let { section, items }: SectionContentProps = $props();

	let card = $derived(items.find((i) => i.sectionId === section.id));
	let aspect = $derived((section.sectionData?.aspect as string) ?? 'fit');
</script>

<div class="@container/grid relative col-span-3 px-2 py-8">
	{#if card}
		<div class="w-full" style={singleCardAspectStyle(card, aspect)}>
			<BaseCard item={card}>
				<Card item={card} />
			</BaseCard>
		</div>
	{/if}
</div>
