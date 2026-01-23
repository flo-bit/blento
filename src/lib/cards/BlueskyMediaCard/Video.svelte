<script lang="ts">
	import { onMount } from 'svelte';
	import Hls from 'hls.js';

	const {
		video
	}: {
		video: {
			playlist: string;
			thumbnail: string;
			alt: string;
		};
	} = $props();

	onMount(() => {
		// Ensure muted is set programmatically (some browsers require this)
		element.muted = true;

		if (Hls.isSupported()) {
			// Use hls.js for browsers that don't support HLS natively
			const hls = new Hls();
			hls.loadSource(video.playlist);
			hls.attachMedia(element);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				element.muted = true;
				element.play().catch((e) => {
					console.error('HLS play error:', e);
				});
			});
		} else if (element.canPlayType('application/vnd.apple.mpegurl')) {
			// Safari supports HLS natively
			element.src = video.playlist;
			element.addEventListener('canplay', () => {
				element.muted = true;
				element.play().catch((e) => {
					console.error('Native HLS play error:', e);
				});
			});
		}
	});

	let element: HTMLVideoElement;
</script>

<img src={video.thumbnail} class="absolute inset-0 -z-10 h-full w-full object-cover" alt="" />
<video
	bind:this={element}
	muted
	loop
	autoplay
	playsinline
	class="absolute inset-0 h-full w-full object-cover"
	aria-label={video.alt}
></video>
