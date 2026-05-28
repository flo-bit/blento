<script lang="ts">
	let { src, alt = '' }: { src?: string; alt?: string } = $props();
	let hasError = $state(false);
</script>

{#if src && !hasError}
	<img
		{src}
		{alt}
		class="h-full w-full rounded-xl object-cover"
		onerror={() => {
			hasError = true;
		}}
	/>
{:else}
	<div
		class="bg-base-200 dark:bg-base-800 accent:bg-accent-700/40 flex h-full w-full items-center justify-center rounded-xl text-lg"
	>
		🐻
	</div>
{/if}
