<script lang="ts">
	import type { Item } from '$lib/types';
	import type { SettingsComponentProps } from '../types';
	import { Button, Label } from '@foxui/core';
	import GiphySearchModal from './GiphySearchModal.svelte';

	let { item = $bindable<Item>() }: SettingsComponentProps = $props();

	let isSearchOpen = $state(false);

	function handleGifSelect(gif: {
		id: string;
		title: string;
		images: { original: { mp4: string } };
	}) {
		item.cardData.url = gif.images.original.mp4;
		item.cardData.alt = gif.title;
		isSearchOpen = false;
	}
</script>

<div class="flex flex-col gap-2">
	<Button variant="secondary" class="w-full justify-start" onclick={() => (isSearchOpen = true)}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="mr-2 size-4"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
			/>
		</svg>
		Change GIF
	</Button>
</div>

<GiphySearchModal
	bind:open={isSearchOpen}
	onselect={handleGifSelect}
	oncancel={() => (isSearchOpen = false)}
/>
