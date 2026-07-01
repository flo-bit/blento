<script lang="ts">
	import type { ContentComponentProps } from '../../types';
	import { bandcampPlayerUri, isBandcampUrl } from './shared';

	let { item, isEditing }: ContentComponentProps = $props();

	const src = $derived(
		isBandcampUrl(item.cardData?.href) ? bandcampPlayerUri(item.cardData.href) : null
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
			seamless
			title="Bandcamp player"
		></iframe>
	</div>
{:else}
	<div class="flex h-full items-center justify-center p-4 text-center opacity-50">
		Missing Bandcamp URL
	</div>
{/if}
