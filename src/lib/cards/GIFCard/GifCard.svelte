<script lang="ts">
	import { getDidContext } from '$lib/website/context';
	import { getImageBlobUrl } from '$lib/oauth/utils';
	import type { ContentComponentProps } from '../types';

	let { item }: ContentComponentProps = $props();

	const did = getDidContext();

	function getSrc() {
		if (item.cardData.objectUrl) return item.cardData.objectUrl;

		if (item.cardData.image && typeof item.cardData.image === 'object') {
			return getImageBlobUrl({ did, link: item.cardData.image?.ref?.$link });
		}

		return item.cardData.url || item.cardData.image;
	}

	let hasError = $state(false);
</script>

<div class="relative h-full w-full overflow-hidden">
	{#key item.cardData.url || item.cardData.image || item.cardData.objectUrl}
		{#if getSrc() && !hasError}
			<img
				class="absolute inset-0 h-full w-full object-cover"
				src={getSrc()}
				alt={item.cardData.alt || 'GIF'}
				onerror={() => (hasError = true)}
			/>
		{:else}
			<div
				class="flex h-full w-full items-center justify-center bg-base-100 dark:bg-base-900"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="text-base-400 dark:text-base-600 size-12"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
					/>
				</svg>
			</div>
		{/if}
	{/key}
</div>
