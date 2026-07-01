<script lang="ts">
	import { Label } from '@foxui/core';
	import type { SectionSettingsProps } from '../types';

	// items is bindable so the sidebar can bind uniformly across all section
	// settings panels (only Hero actually mutates it).
	let { section, items = $bindable(), onlayoutchange }: SectionSettingsProps = $props();

	let d = $derived(section.sectionData);
	let aspect = $derived((d.aspect as string) ?? 'fit');

	const options = [
		{ value: 'fit', label: 'Fit' },
		{ value: '16 / 9', label: 'Wide' },
		{ value: '1 / 1', label: 'Square' },
		{ value: '3 / 4', label: 'Tall' }
	];

	function update(key: string, value: any) {
		section.sectionData = { ...d, [key]: value };
		onlayoutchange();
	}
</script>

<section class="flex flex-col gap-2">
	<Label class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Shape</Label>
	<div class="grid grid-cols-4 gap-1">
		{#each options as opt (opt.value)}
			<button
				type="button"
				class={[
					'flex h-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors',
					aspect === opt.value
						? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
						: 'border-base-200 dark:border-base-700 text-base-600 dark:text-base-400 hover:bg-base-100 dark:hover:bg-base-800'
				]}
				aria-pressed={aspect === opt.value}
				onclick={() => update('aspect', opt.value)}
			>
				{opt.label}
			</button>
		{/each}
	</div>
	<p class="text-base-400 dark:text-base-500 text-xs">
		"Fit" uses the card's natural proportions (great for images).
	</p>
</section>
