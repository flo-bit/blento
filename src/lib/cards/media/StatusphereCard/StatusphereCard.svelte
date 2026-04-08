<script lang="ts">
	import type { Item } from '$lib/types';
	import { getAdditionalUserData } from '$lib/website/context';
	import { emojiToNotoAnimatedWebp } from '.';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let record = $state(data[item.cardType] as any);

	let mode = $derived(item.cardData?.mode ?? 'emoji');
	// Emoji mode: use cardData. Statusphere mode: use latest record from PDS.
	let emoji = $derived(
		mode === 'statusphere' ? record?.value?.status : item.cardData?.emoji
	);
	let animated = $derived(emojiToNotoAnimatedWebp(emoji));
</script>

<div class="flex h-full w-full items-center justify-center p-4">
	{#if animated}
		<img src={animated} alt="" class="h-full max-h-40 w-full object-contain" />
	{:else if emoji}
		<div class="text-9xl">
			{emoji}
		</div>
	{:else}
		No status yet
	{/if}
</div>
