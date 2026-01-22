<script lang="ts">
	import type { Item } from '$lib/types';
	import { getAdditionalUserData } from '$lib/website/context';
	import { emojiToNotoAnimatedWebp } from '.';

	

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let record = $state(data[item.cardType] as any);

	let animated = $derived(emojiToNotoAnimatedWebp(record?.value?.status));
</script>

<div class="flex h-full w-full items-center justify-center p-4">
	{#if animated}
		<img src={animated} alt="" class="h-full max-h-40 w-full object-contain" />
	{:else if record?.value?.status}
		<div class="text-9xl">
			{record?.value?.status}
		</div>
	{:else}
		No status yet
	{/if}

	{#if item.cardData.title}
		<div
			class="text-base-900 dark:text-base-50 text-md bg-base-200/30 dark:bg-base-900/30 absolute top-2 right-2 left-2 z-30 line-clamp-1 rounded-lg p-1 font-bold backdrop-blur-md"
		>
			{item.cardData.title}
		</div>
	{/if}
</div>
