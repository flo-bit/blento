<script lang="ts">
	import type { ContentComponentProps } from '../../types';

	let { item, isEditing }: ContentComponentProps = $props();

	let src = $derived(
		item.cardData?.href
			? `https://w.soundcloud.com/player/?url=${encodeURIComponent(
					item.cardData.href
				)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`
			: null
	);
</script>

{#if src}
	<div class="absolute inset-0 p-2">
		<iframe
			class={['h-full w-full rounded-2xl', isEditing && 'pointer-events-none']}
			{src}
			frameborder="0"
			allow="autoplay"
			loading="lazy"
			scrolling="no"
			title="SoundCloud player"
		></iframe>
	</div>
{:else}
	<div class="flex h-full items-center justify-center p-4 text-center opacity-50">
		Missing SoundCloud URL
	</div>
{/if}
