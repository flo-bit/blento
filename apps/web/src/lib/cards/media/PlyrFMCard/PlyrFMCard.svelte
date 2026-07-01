<script lang="ts">
	import type { ContentComponentProps } from '../../types';

	let { item, isEditing }: ContentComponentProps = $props();
</script>

{#if item.cardData?.href}
	<div class="absolute inset-0 p-2">
		<iframe
			class={['h-full w-full rounded-2xl', isEditing && 'pointer-events-none']}
			src={item.cardData.href}
			frameborder="0"
			allow="autoplay; encrypted-media"
			loading="lazy"
			title="Plyr.fm"
		></iframe>
	</div>
{:else}
	<div class="flex h-full items-center justify-center p-4 text-center opacity-50">
		Missing Plyr.fm URL
	</div>
{/if}
