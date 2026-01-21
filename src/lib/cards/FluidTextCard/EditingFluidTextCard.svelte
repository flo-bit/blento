<script lang="ts">
	import type { Item } from '$lib/types';
	import type { ContentComponentProps } from '../types';
	import FluidTextCard from './FluidTextCard.svelte';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();

	let isEditing = $state(false);
	let inputElement: HTMLInputElement | null = $state(null);

	function handleClick() {
		if (isEditing) return;
		isEditing = true;
		requestAnimationFrame(() => {
			inputElement?.focus();
			inputElement?.select();
		});
	}

	function handleBlur() {
		isEditing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === 'Escape') {
			isEditing = false;
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="relative h-full w-full cursor-text transition-colors duration-150 {isEditing ? 'ring-2 ring-white/30' : ''}"
	onclick={handleClick}
>
	<FluidTextCard {item} />

	{#if isEditing}
		<!-- svelte-ignore a11y_autofocus -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="absolute inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onclick={(e) => e.stopPropagation()}
		>
			<input
				bind:this={inputElement}
				bind:value={item.cardData.text}
				onblur={handleBlur}
				onkeydown={handleKeydown}
				class="w-full max-w-md rounded-md border border-white/20 bg-white/10 px-4 py-3 text-center text-2xl font-bold text-white outline-none transition-colors focus:border-white/40 focus:bg-white/20"
				placeholder="Enter text"
				autofocus
			/>
		</div>
	{/if}
</div>
