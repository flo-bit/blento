<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import ImageViewerModal from './ImageViewerModal.svelte';
	import { registerImageViewer, unregisterImageViewer } from './imageViewer.svelte';

	let open = $state(false);
	let src = $state('');

	function show(newSrc: string) {
		src = newSrc;
		open = true;
	}

	onMount(() => {
		registerImageViewer(show);
	});

	onDestroy(() => {
		unregisterImageViewer();
	});
</script>

<ImageViewerModal bind:open {src} />
