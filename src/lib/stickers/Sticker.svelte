<script lang="ts">
	import type { Sticker } from './types';
	import { getImage } from '$lib/helper';
	import { getDidContext } from '$lib/website/context';

	let { sticker }: { sticker: Sticker } = $props();

	const did = getDidContext();

	let imageUrl = $derived(sticker.type === 'image' ? getImage(sticker, did, 'image') : undefined);
</script>

<div
	class="absolute"
	style="left: calc(50% + {sticker.x / 100}%); top: {sticker.y /
		100}%; transform: translate(-50%, -50%) rotate({sticker.rotation}deg) scale({sticker.scale /
		100});"
>
	{#if sticker.type === 'emoji'}
		<span class="text-4xl select-none">{sticker.emoji}</span>
	{:else if sticker.type === 'image' && imageUrl}
		<img src={imageUrl} alt="sticker" class="h-16 w-16 object-contain" draggable="false" />
	{/if}
</div>
