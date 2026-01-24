<script lang="ts">
	import type { ContentComponentProps } from '../types';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';

	let { item, isEditing }: ContentComponentProps = $props();

	const profileUrl = $derived(`https://bsky.app/profile/${item.cardData.handle}`);
</script>

<a
	target="_blank"
	href={profileUrl}
	class="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl p-2 transition-colors duration-150"
	use:qrOverlay={{
		disabled: isEditing,
		context: {
			title: item.cardData.displayName || item.cardData.handle
		}
	}}
>
	<img
		src={item.cardData.avatar}
		class="aspect-square size-24 rounded-full transition-all duration-100 group-hover:scale-105"
		alt=""
	/>
	<div class="text-md line-clamp-1 text-center font-bold">
		{item.cardData.displayName || item.cardData.handle}
	</div>
</a>
