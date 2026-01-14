<script lang="ts">
	import { getIsMobile } from '$lib/helper';
	import type { ContentComponentProps } from '../types';
	import PlainTextEditor from '../utils/PlainTextEditor.svelte';

	let { item = $bindable() }: ContentComponentProps = $props();

	let isMobile = getIsMobile();

	let faviconHasError = $state(false);
</script>

<div class="flex h-full flex-col justify-between p-4">
	<div>
		{#if item.cardData.favicon}
			<div
				class="bg-base-100 border-base-300 dark:border-base-800 dark:bg-base-900 mb-2 inline-flex size-8 items-center justify-center rounded-xl border shadow-sm"
			>
				{#if !faviconHasError}
					<img
						class="size-6 rounded-lg object-cover"
						onerror={() => (faviconHasError = true)}
						src={item.cardData.favicon}
						alt=""
					/>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
						/>
					</svg>
				{/if}
			</div>
		{/if}

		<div
			class="hover:bg-base-200/70 dark:hover:bg-base-800/70 accent:hover:bg-accent-400 -m-1 rounded-md p-1 transition-colors duration-200"
		>
			<PlainTextEditor
				class="text-base-900 dark:text-base-50 text-lg font-bold"
				key="title"
				bind:item
			/>
		</div>
		<!-- <div class="text-base-800 dark:text-base-100 mt-2 text-xs">{item.cardData.description}</div> -->
		<div class="text-accent-600 accent:text-accent-950 font-semibold dark:text-accent-400 mt-2 text-xs">
			{item.cardData.domain}
		</div>
	</div>

	{#if ((isMobile() && item.mobileH >= 8) || (!isMobile() && item.h >= 4)) && item.cardData.image}
		<img class=" mb-2 max-h-32 w-full rounded-xl object-cover" src={item.cardData.image} alt="" />
	{/if}
</div>
