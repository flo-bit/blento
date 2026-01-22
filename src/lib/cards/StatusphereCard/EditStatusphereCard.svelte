<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { CardDefinitionsByType } from '..';
	import { PopoverEmojiPicker } from '@foxui/social';

	
	import { emojiToNotoAnimatedWebp } from '.';
	import PlainTextEditor from '../utils/PlainTextEditor.svelte';
	import { cn } from '@foxui/core';

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

	let showPopover = $state(false);
</script>

<div class="flex h-full w-full items-center justify-center p-4">
	<PopoverEmojiPicker
		bind:open={showPopover}
		onpicked={(emoji) => {
			record ??= {
				value: {}
			};

			record.value.status = emoji.unicode;

			item.cardData.hasUpdate = true;
			item.cardData.emoji = emoji.unicode;

			showPopover = false;
		}}
	>
		{#snippet child({ props })}
			{@const animated = emojiToNotoAnimatedWebp(record?.value?.status)}

			<button {...props} class="z-20 h-full max-h-40 w-full max-w-40">
				{#if animated}
					<img
						src={animated}
						alt=""
						class="hover:bg-base-500/10 h-full max-h-40 w-full max-w-40 rounded-2xl object-contain"
					/>
				{:else if record?.value?.status}
					<div class="text-9xl">
						{record.value.status}
					</div>
				{:else}
					<div>Click here to set a status</div>
				{/if}
			</button>
		{/snippet}
	</PopoverEmojiPicker>

	<div
		class={cn(
			'bg-base-200/30 dark:bg-base-900/30 absolute top-2 right-2 left-2 z-30 rounded-lg p-1 backdrop-blur-md',
			!item.cardData.title && 'hidden group-hover/card:block'
		)}
	>
		<PlainTextEditor
			class="text-base-900 dark:text-base-50 text-md line-clamp-1 font-bold"
			key="title"
			bind:item
			placeholder="I'm feeling..."
		/>
	</div>
</div>
