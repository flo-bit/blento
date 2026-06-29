<script lang="ts">
	import { ToggleGroup, ToggleGroupItem } from '@foxui/core';

	let {
		value = $bindable(),
		type,
		fallback
	}: {
		value: string | undefined;
		type: 'vertical' | 'horizontal';
		fallback?: string;
	} = $props();

	const defaultValue = $derived(fallback ?? (type === 'vertical' ? 'top' : 'left'));
	const itemClass = 'size-8 min-w-8 flex-1 [&_svg]:size-3.5 cursor-pointer';
</script>

<ToggleGroup
	type="single"
	class="w-full"
	bind:value={
		() => value ?? defaultValue,
		(next) => {
			if (!next) return;
			value = next;
		}
	}
>
	{#if type === 'vertical'}
		<ToggleGroupItem size="sm" value="top" class={itemClass} aria-label="Align top">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect width="6" height="16" x="4" y="6" rx="2" />
				<rect width="6" height="9" x="14" y="6" rx="2" />
				<path d="M22 2H2" />
			</svg>
		</ToggleGroupItem>
		<ToggleGroupItem size="sm" value="center" class={itemClass} aria-label="Align middle">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect width="10" height="6" x="7" y="9" rx="2" />
				<path d="M22 20H2" />
				<path d="M22 4H2" />
			</svg>
		</ToggleGroupItem>
		<ToggleGroupItem size="sm" value="bottom" class={itemClass} aria-label="Align bottom">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect width="14" height="6" x="5" y="12" rx="2" />
				<rect width="10" height="6" x="7" y="2" rx="2" />
				<path d="M2 22h20" />
			</svg>
		</ToggleGroupItem>
	{:else}
		<ToggleGroupItem size="sm" value="left" class={itemClass} aria-label="Align left">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 5H3" />
				<path d="M15 12H3" />
				<path d="M17 19H3" />
			</svg>
		</ToggleGroupItem>
		<ToggleGroupItem size="sm" value="center" class={itemClass} aria-label="Align center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 5H3" />
				<path d="M17 12H7" />
				<path d="M19 19H5" />
			</svg>
		</ToggleGroupItem>
		<ToggleGroupItem size="sm" value="right" class={itemClass} aria-label="Align right">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 5H3" />
				<path d="M21 12H9" />
				<path d="M21 19H7" />
			</svg>
		</ToggleGroupItem>
	{/if}
</ToggleGroup>
