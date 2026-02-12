<script lang="ts">
	import type { Sticker } from './types';
	import EditableSticker from './EditableSticker.svelte';

	let {
		stickers = $bindable(),
		onchange
	}: {
		stickers: Sticker[];
		onchange?: () => void;
	} = $props();

	let selectedStickerId: string | null = $state(null);
	let layerEl: HTMLDivElement | undefined = $state();

	function deleteSticker(id: string) {
		stickers = stickers.filter((s) => s.id !== id);
		selectedStickerId = null;
		onchange?.();
	}
</script>

<div
	bind:this={layerEl}
	class="pointer-events-none absolute inset-0 z-40 overflow-visible"
	onpointerdown={(e) => {
		// Deselect when clicking on the layer background (not a sticker)
		if (e.target === e.currentTarget) {
			selectedStickerId = null;
		}
	}}
>
	{#each stickers as sticker, i (sticker.id)}
		<EditableSticker
			bind:sticker={stickers[i]}
			selected={selectedStickerId === sticker.id}
			containerRef={layerEl}
			onselect={() => {
				selectedStickerId = sticker.id;
			}}
			ondelete={() => deleteSticker(sticker.id)}
			{onchange}
		/>
	{/each}
</div>
