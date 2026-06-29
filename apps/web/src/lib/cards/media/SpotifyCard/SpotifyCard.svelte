<script lang="ts">
	import type { ContentComponentProps } from '../../types';

	let { item, isEditing }: ContentComponentProps = $props();
</script>

{#if item.cardData?.spotifyType && item.cardData?.spotifyId}
	<div class="absolute inset-0 p-2">
		<iframe
			class={['h-full w-full rounded-2xl', isEditing && 'pointer-events-none']}
			src="https://open.spotify.com/embed/{item.cardData.spotifyType}/{item.cardData
				.spotifyId}?utm_source=generator&theme=0"
			frameborder="0"
			allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
			loading="lazy"
			title="Spotify {item.cardData.spotifyType}"
		></iframe>
	</div>
{:else}
	<div class="flex h-full items-center justify-center p-4 text-center opacity-50">
		Missing Spotify data
	</div>
{/if}
