<script lang="ts">
	import type { ContentComponentProps } from '../../types';

	let { item }: ContentComponentProps = $props();

	// svelte-ignore state_referenced_locally
	let domain = new URL(item.cardData.embed || item.cardData.href).hostname;
</script>

{#if domain === 'stream.place'}
	<iframe
		src={item.cardData.embed || item.cardData.href}
		sandbox="allow-scripts allow-same-origin"
		referrerpolicy="no-referrer"
		class="absolute inset-0 h-full w-full"
		title=""
	></iframe>
{:else}
	<div class="p-4">Invalid domain</div>
{/if}
