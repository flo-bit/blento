<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Label } from '@foxui/core';

	let {
		label,
		description,
		for: forId,
		children
	}: {
		label?: string;
		description?: string;
		for?: string;
		children: Snippet;
	} = $props();
</script>

<div class="flex flex-col gap-1.5">
	{#if label}
		<Label for={forId} class="text-sm">{label}</Label>
	{/if}
	{@render children()}
	{#if description}
		<p class="text-base-500 dark:text-base-400 text-xs">{description}</p>
	{/if}
</div>
