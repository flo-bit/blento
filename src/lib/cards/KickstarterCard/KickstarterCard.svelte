<script lang="ts">
	import type { ContentComponentProps } from '../types';

	let { item, isEditing }: ContentComponentProps = $props();

	let isVideo = $derived(item.cardData.widgetType === 'video');
	let projectUrl = $derived(
		(item.cardData.src || '').replace(/\/widget\/(card|video)\.html.*$/, '')
	);
</script>

<iframe
	src={item.cardData.src}
	title="Kickstarter widget"
	frameborder="0"
	scrolling="no"
	class={['absolute inset-0 h-full w-full', (!isVideo || isEditing) && 'pointer-events-none']}
></iframe>

{#if !isVideo && !isEditing}
	<a href={projectUrl} target="_blank" rel="noopener noreferrer">
		<div class="absolute inset-0 z-50"></div>
		<span class="sr-only">Open Kickstarter project</span>
	</a>
{/if}
