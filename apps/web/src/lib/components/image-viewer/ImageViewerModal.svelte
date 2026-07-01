<script lang="ts">
	import { fade } from 'svelte/transition';

	let { open = $bindable(false), src = '' }: { open: boolean; src: string } = $props();

	function close() {
		open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			close();
		}
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
		transition:fade={{ duration: 150 }}
		onclick={close}
		onkeydown={(e) => {
			if (e.key === 'Escape') close();
		}}
		role="dialog"
		aria-modal="true"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<img
			{src}
			alt=""
			class="max-h-[90vh] max-w-[90vw] object-contain"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		/>
	</div>
{/if}
