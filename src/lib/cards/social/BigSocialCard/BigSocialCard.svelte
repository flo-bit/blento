<script lang="ts">
	import { platformsData } from '.';
	import type { ContentComponentProps } from '../../types';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';

	let { item, isEditing }: ContentComponentProps = $props();

	const platform = $derived(item.cardData.platform as string);
	const platformData = $derived(platformsData[platform]);

	// Color logic:
	// - base/transparent/undefined: background = brand color, icon = white
	// - other: background = that color (from BaseCard), icon = white
	const useBrandBackground = $derived(
		!item.color || item.color === 'base' || item.color === 'transparent'
	);
	const brandColor = $derived(`#${item.cardData.color}`);
</script>

<div
	class="flex h-full w-full items-center justify-center p-10"
	style={useBrandBackground ? `background-color: ${brandColor}` : ''}
>
	<div
		class="flex aspect-square max-h-full max-w-full items-center justify-center [&_svg]:size-full [&_svg]:max-w-60 [&_svg]:fill-white"
	>
		{@html platformData?.svg}
	</div>
</div>

{#if !isEditing}
	<a
		href={item.cardData.href}
		target="_blank"
		rel="noopener noreferrer"
		use:qrOverlay={{
			context: {
				title: platformData?.title,
				icon: platformData?.svg,
				iconColor: platformData?.hex
			}
		}}
	>
		<div class="absolute inset-0 z-50"></div>
		<span class="sr-only">open {platformData?.title}</span>
	</a>
{/if}
