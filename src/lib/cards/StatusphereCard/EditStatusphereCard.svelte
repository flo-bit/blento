<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { CardDefinitionsByType } from '..';
	import { PopoverEmojiPicker } from '@foxui/social';
	import { emojiToNotoAnimatedWebp } from '.';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let record = $state(data[item.cardType] as any);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (!record) {
			record = (await CardDefinitionsByType[item.cardType]?.loadData?.([], {
				did,
				handle
			})) as any;

			data[item.cardType] = record;
		}
	});

	// Use card-specific emoji if set, otherwise fall back to PDS data
	let emoji = $derived(item.cardData?.emoji ?? record?.value?.status);

	let showPopover = $state(false);
</script>

<div class="flex h-full w-full items-center justify-center p-4">
	<PopoverEmojiPicker
		bind:open={showPopover}
		onpicked={(picked) => {
			item.cardData.hasUpdate = true;
			item.cardData.emoji = picked.unicode;

			showPopover = false;
		}}
	>
		{#snippet child({ props })}
			{@const animated = emojiToNotoAnimatedWebp(emoji)}

			<button {...props} class="z-20 h-full max-h-40 w-full max-w-40">
				{#if animated}
					<img
						src={animated}
						alt=""
						class="hover:bg-base-500/10 h-full max-h-40 w-full max-w-40 rounded-2xl object-contain"
					/>
				{:else if emoji}
					<div class="text-9xl">
						{emoji}
					</div>
				{:else}
					<div>Click here to set a status</div>
				{/if}
			</button>
		{/snippet}
	</PopoverEmojiPicker>
</div>
