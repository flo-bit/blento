<script lang="ts">
	import { videoPlayer } from '../utils/YoutubeVideoPlayer.svelte';
	import type { ContentComponentProps } from '../types';

	let { item }: ContentComponentProps = $props();
</script>

<img
	class={[
		'absolute inset-0 h-full w-full object-cover opacity-100 transition-transform duration-300 ease-in-out',
		item.cardData.href ? 'group-hover:scale-102' : ''
	]}
	src={item.cardData.poster}
	alt=""
/>
<button
	onclick={() => {
		videoPlayer.show(item.cardData.youtubeId);
	}}
	class="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center"
>
	<span class="sr-only">
		{item.cardData.hrefText ?? 'Learn more'}
	</span>

	<svg xmlns="http://www.w3.org/2000/svg" class="text-accent-500 w-14" viewBox="0 0 256 180"
		><path
			fill="currentColor"
			d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134"
		/><path fill="#fff" d="m102.421 128.06l66.328-38.418l-66.328-38.418z" /></svg
	>
</button>
