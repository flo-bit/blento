<script lang="ts">
	import { platformsData } from '.';
	import type { ContentComponentProps } from '../types';

	let { item, isEditing }: ContentComponentProps = $props();

	const platform = $derived(item.cardData.platform as string);
</script>

<div
	class="flex h-full w-full items-center justify-center p-10"
	style={`background-color: #${item.cardData.color}`}
>
	<div
		class="flex aspect-square max-h-full max-w-full items-center justify-center [&_svg]:size-full [&_svg]:max-w-60 [&_svg]:fill-white"
	>
		{@html platformsData[platform].svg}
	</div>
</div>

{#if !isEditing}
	<a href={item.cardData.href} target="_blank" rel="noopener noreferrer">
		<div class="absolute inset-0 z-50"></div>
		<span class="sr-only">open {platformsData[platform].title}</span>
	</a>
{/if}
