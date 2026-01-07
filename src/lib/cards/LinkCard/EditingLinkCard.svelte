<script lang="ts">
	import { getIsMobile } from '$lib/helper';
	import type { ContentComponentProps } from '../types';
	import PlainTextEditor from '../utils/PlainTextEditor.svelte';

	let { item = $bindable() }: ContentComponentProps = $props();

	let isMobile = getIsMobile();
</script>

<div class="flex h-full flex-col justify-between p-4">
	<div>
		{#if item.cardData.favicon}
			<img class="mb-2 size-8 rounded-lg object-cover" src={item.cardData.favicon} alt="" />
		{/if}

		<div
			class="hover:bg-base-200/70 dark:hover:bg-base-800/70 -m-1 rounded-md p-1 transition-colors duration-200"
		>
			<PlainTextEditor
				class="text-base-900 dark:text-base-50 text-lg font-semibold"
				key="title"
				bind:item
			/>
		</div>
		<!-- <div class="text-base-800 dark:text-base-100 mt-2 text-xs">{item.cardData.description}</div> -->
		<div class="text-accent-600 dark:text-accent-400 mt-2 text-xs font-light">
			{item.cardData.domain}
		</div>
	</div>

	{#if ((isMobile() && item.mobileH >= 4) || (!isMobile() && item.h >= 2)) && item.cardData.image}
		<img class=" mb-2 max-h-32 w-full rounded-xl object-cover" src={item.cardData.image} alt="" />
	{/if}
</div>
