<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		children
	}: {
		title?: string;
		description?: string;
		children: Snippet;
	} = $props();
</script>

<section class="flex flex-col gap-3">
	{#if title}
		<div class="flex flex-col gap-0.5">
			<h3 class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">
				{title}
			</h3>
			{#if description}
				<p class="text-base-400 dark:text-base-500 text-xs">{description}</p>
			{/if}
		</div>
	{/if}
	{@render children()}
</section>
