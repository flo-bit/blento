<script lang="ts">
	import type { ContentComponentProps } from '../../types';

	let { item, isEditing }: ContentComponentProps = $props();
</script>

{#if item.cardData?.appleMusicType && item.cardData?.appleMusicId && item.cardData?.appleMusicStorefront}
	<div class="absolute inset-0 p-2">
		<iframe
			class={['h-full w-full rounded-2xl', isEditing && 'pointer-events-none']}
			src="https://embed.music.apple.com/{item.cardData.appleMusicStorefront}/{item.cardData
				.appleMusicType}/{item.cardData.appleMusicId}"
			sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
			loading="lazy"
			title="Apple Music {item.cardData.appleMusicType}"
		></iframe>
	</div>
{:else}
	<div class="flex h-full items-center justify-center p-4 text-center opacity-50">
		Missing Apple Music data
	</div>
{/if}
