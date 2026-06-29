<script lang="ts">
	import { buttonVariants, Popover, cn } from '@foxui/core';
	import SelectTheme from './SelectTheme.svelte';

	let {
		accentColor = $bindable('pink'),
		baseColor = $bindable('stone'),
		selectAccentColor = true,
		selectBaseColor = true,
		onchanged
	}: {
		accentColor?: string;
		baseColor?: string;
		selectAccentColor?: boolean;
		selectBaseColor?: boolean;
		onchanged?: (accentColor: string, baseColor: string) => void;
	} = $props();
</script>

<Popover>
	{#snippet child({ props })}
		<button
			{...props}
			class={cn(
				buttonVariants({ variant: 'link', size: 'default' }),
				'flex cursor-pointer items-center gap-0 -space-x-2 backdrop-blur-none'
			)}
		>
			{#if selectAccentColor}
				<div
					class=" from-accent-500 to-accent-600 border-accent-700 dark:border-accent-400 z-10 size-6 rounded-full border bg-linear-to-b"
				></div>
			{/if}

			{#if selectBaseColor}
				<div
					class=" from-base-500 to-base-600 border-base-700 dark:border-base-400 size-6 rounded-full border bg-linear-to-b"
				></div>
			{/if}
		</button>
	{/snippet}
	<SelectTheme bind:accentColor bind:baseColor {selectAccentColor} {selectBaseColor} {onchanged} />
</Popover>
