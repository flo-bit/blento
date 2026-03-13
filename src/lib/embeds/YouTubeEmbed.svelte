<script lang="ts">
	import type { EmbedComponentProps } from './types';

	let { data }: EmbedComponentProps = $props();

	let videoId = $derived(data.videoId as string);
	let poster = $derived(data.poster as string);
	let isPlaying = $state(false);
</script>

{#if isPlaying}
	<div class="relative aspect-video w-full overflow-hidden rounded-xl">
		<iframe
			class="absolute inset-0 h-full w-full"
			src="https://www.youtube.com/embed/{videoId}?autoplay=1"
			title="YouTube video player"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowfullscreen
		></iframe>
	</div>
{:else}
	<button
		onclick={() => (isPlaying = true)}
		class="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl"
	>
		<img
			class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
			src={poster}
			alt="YouTube video thumbnail"
		/>
		<div class="absolute inset-0 flex items-center justify-center">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-16 drop-shadow-lg" viewBox="0 0 256 180">
				<path
					fill="#f00"
					d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134"
				/>
				<path fill="#fff" d="m102.421 128.06l66.328-38.418l-66.328-38.418z" />
			</svg>
		</div>
	</button>
{/if}
