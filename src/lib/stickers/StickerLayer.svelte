<script lang="ts">
	import type { Sticker } from './types';
	import StickerComponent from './Sticker.svelte';

	let { stickers }: { stickers: Sticker[] } = $props();
</script>

<div class="pointer-events-none absolute inset-0 z-40 overflow-visible">
	{#each stickers as sticker (sticker.id)}
		<StickerComponent {sticker} />
	{/each}
</div>
