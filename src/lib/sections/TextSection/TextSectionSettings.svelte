<script lang="ts">
	import { Label, ToggleGroup, ToggleGroupItem } from '@foxui/core';
	import type { SectionSettingsProps } from '../types';

	// items is bindable so the sidebar can bind uniformly across all section
	// settings panels (only Hero actually mutates it).
	let { section, items = $bindable(), onlayoutchange }: SectionSettingsProps = $props();

	let d = $derived(section.sectionData);

	const sizes = [
		{ value: 0, label: 'S' },
		{ value: 1, label: 'M' },
		{ value: 2, label: 'L' },
		{ value: 3, label: 'XL' }
	];
	let textSize = $derived((d.textSize ?? 1) as number);

	const toggleClasses = 'size-8 min-w-8 [&_svg]:size-3 cursor-pointer';

	function update(key: string, value: any) {
		section.sectionData = { ...d, [key]: value };
		onlayoutchange();
	}
</script>

<section class="flex flex-col gap-2">
	<Label class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Alignment</Label>
	<ToggleGroup
		type="single"
		bind:value={
			() => (d.textAlign as string) ?? 'left',
			(value) => {
				if (value) update('textAlign', value);
			}
		}
	>
		<ToggleGroupItem size="sm" value="left" class={toggleClasses}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M21 5H3" /><path d="M15 12H3" /><path d="M17 19H3" /></svg
			>
		</ToggleGroupItem>
		<ToggleGroupItem size="sm" value="center" class={toggleClasses}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M21 5H3" /><path d="M17 12H7" /><path d="M19 19H5" /></svg
			>
		</ToggleGroupItem>
		<ToggleGroupItem size="sm" value="right" class={toggleClasses}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M21 5H3" /><path d="M21 12H9" /><path d="M21 19H7" /></svg
			>
		</ToggleGroupItem>
	</ToggleGroup>
</section>

<section class="flex flex-col gap-2">
	<Label class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Text size</Label>
	<div class="grid grid-cols-4 gap-1">
		{#each sizes as size (size.value)}
			<button
				type="button"
				class={[
					'flex h-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors',
					textSize === size.value
						? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
						: 'border-base-200 dark:border-base-700 text-base-600 dark:text-base-400 hover:bg-base-100 dark:hover:bg-base-800'
				]}
				aria-pressed={textSize === size.value}
				onclick={() => update('textSize', size.value)}
			>
				{size.label}
			</button>
		{/each}
	</div>
</section>
