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
</div>
