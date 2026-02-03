<script lang="ts">
	import type { CreationModalComponentProps } from '../../types';
	import GiphySearchModal from './GiphySearchModal.svelte';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let isOpen = $state(true);

	function handleGifSelect(gif: {
		id: string;
		title: string;
		images: { original: { mp4: string } };
	}) {
		item.cardData.url = gif.images.original.mp4;
		item.cardData.alt = gif.title;
		isOpen = false;
		oncreate();
	}

	function handleCancel() {
		isOpen = false;
		oncancel();
	}
</script>

<GiphySearchModal bind:open={isOpen} onselect={handleGifSelect} oncancel={handleCancel} />
