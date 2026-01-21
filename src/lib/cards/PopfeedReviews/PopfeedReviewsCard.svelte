<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { CardDefinitionsByType } from '..';
	import Rating from './Rating.svelte';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let feed = $state(data[item.cardType] as any);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		console.log(feed);
		if (!feed) {
			feed = (await CardDefinitionsByType[item.cardType]?.loadData?.([], {
				did,
				handle
			})) as any;

			console.log(feed);

			data[item.cardType] = feed;
		}
	});
</script>

<div class="z-10 flex h-full gap-4 overflow-x-scroll p-4">
	{#each feed ?? [] as review}
		{#if review.value.rating !== undefined && review.value.posterUrl}
			<a
				rel="noopener noreferrer"
				target="_blank"
				class="flex"
				href="https://popfeed.social/review/{review.uri}"
			>
				<div
					class="relative flex aspect-[2/3] h-full flex-col items-center justify-end overflow-hidden rounded-xl p-1"
				>
					<img
						src={review.value.posterUrl}
						alt=""
						class="bg-base-200 absolute inset-0 -z-10 h-full w-full object-cover"
					/>

					<div
						class="from-base-900/80 absolute right-0 bottom-0 left-0 h-1/3 bg-gradient-to-t via-transparent"
					></div>

					<Rating class="z-10 text-lg" rating={review.value.rating} />
				</div>
			</a>
		{/if}
	{/each}
</div>
