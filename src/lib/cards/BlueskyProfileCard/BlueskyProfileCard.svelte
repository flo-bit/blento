<script lang="ts">
	import type { Item } from '$lib/types';

	let { item }: { item: Item } = $props();
</script>

<a
	target="_blank"
	href="/{item.cardData.handle}"
	class="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl p-2 transition-colors duration-150"
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
