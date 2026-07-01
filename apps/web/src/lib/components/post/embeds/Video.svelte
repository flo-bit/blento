<script lang="ts">
	import { onMount } from 'svelte';
	import Hls from 'hls.js';
	import type { PostEmbedVideo } from '..';

	const { data }: { data: PostEmbedVideo } = $props();

	onMount(async () => {
		const Plyr = (await import('plyr')).default;
		if (Hls.isSupported()) {
			var hls = new Hls();
			hls.loadSource(data.video.playlist);
			hls.attachMedia(element);
		}

		new Plyr(element, {
			controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
			ratio: data.video.aspectRatio
				? `${data.video.aspectRatio.width}:${data.video.aspectRatio.height}`
				: '16:9'
		});
	});

	let element: HTMLMediaElement;
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
</svelte:head>

<div
	style={data.video.aspectRatio
		? `aspect-ratio: ${data.video.aspectRatio.width} / ${data.video.aspectRatio.height}`
		: 'aspect-ratio: 16 / 9'}
	class="border-base-300 dark:border-base-400/40 w-full max-w-full overflow-hidden rounded-2xl border"
>
	<video bind:this={element} class="h-full w-full" aria-label={data.video.alt}></video>
</div>

<style>
	* {
		--plyr-color-main: var(--color-accent-500);
	}
</style>
