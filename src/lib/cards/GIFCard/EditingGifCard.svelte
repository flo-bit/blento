<script lang="ts">
	import type { ContentComponentProps } from '../types';
	import GiphySearchModal from './GiphySearchModal.svelte';

	let { item = $bindable() }: ContentComponentProps = $props();

	let hasError = $state(false);
	let isSearchOpen = $state(false);

	function handleGifSelect(gif: {
		id: string;
		title: string;
		images: { original: { mp4: string } };
	}) {
		item.cardData.url = gif.images.original.mp4;
		item.cardData.alt = gif.title;
		hasError = false;
		isSearchOpen = false;
	}

	function openSearch() {
		isSearchOpen = true;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="group relative h-full w-full cursor-pointer overflow-hidden" onclick={openSearch}>
	{#if item.cardData.url && !hasError}
		<video
			class="absolute inset-0 h-full w-full object-cover"
			src={item.cardData.url}
			autoplay
			loop
			muted
			playsinline
			onerror={() => (hasError = true)}
		></video>
		<!-- Click to change overlay -->
		<div
			class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
		>
			<span class="text-sm font-medium text-white">Click to change</span>
		</div>
	{:else}
		<!-- Empty state -->
		<div
			class="bg-base-100 dark:bg-base-900 flex h-full w-full flex-col items-center justify-center gap-3 p-4"
		>
			<div
				class="border-base-300 dark:border-base-700 flex size-12 items-center justify-center rounded-xl border-2 border-dashed"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="text-base-400 dark:text-base-600 size-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
					/>
				</svg>
			</div>
			<div class="text-center">
				<p class="text-base-700 dark:text-base-300 text-sm font-medium">Click to search GIPHY</p>
			</div>
		</div>
	{/if}
</div>

<GiphySearchModal
	bind:open={isSearchOpen}
	onselect={handleGifSelect}
	oncancel={() => (isSearchOpen = false)}
/>
