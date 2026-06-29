<script lang="ts">
	import { Label } from '@foxui/core';
	import type { SectionSettingsProps } from '../types';

	// items is bindable so the sidebar can bind uniformly across all section
	// settings panels (only Hero actually mutates it).
	let { section, items = $bindable(), onlayoutchange }: SectionSettingsProps = $props();

	let d = $derived(section.sectionData);
	let scrollMode = $derived((d.scrollMode as string) ?? 'scroll');

	const modes: { value: string; label: string; hint: string }[] = [
		{ value: 'scroll', label: 'Scroll', hint: 'Cards stay in one line and scroll sideways.' },
		{ value: 'fit', label: 'Wrap', hint: 'Cards wrap onto multiple lines and stay centered.' }
	];

	function update(key: string, value: any) {
		section.sectionData = { ...d, [key]: value };
		onlayoutchange();
	}
</script>

<section class="flex flex-col gap-2">
	<Label class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Layout</Label>
	<div class="grid grid-cols-2 gap-2">
		{#each modes as mode (mode.value)}
			<button
				type="button"
				class={[
					'flex h-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors',
					scrollMode === mode.value
						? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
						: 'border-base-200 dark:border-base-700 text-base-600 dark:text-base-400 hover:bg-base-100 dark:hover:bg-base-800'
				]}
				aria-pressed={scrollMode === mode.value}
				onclick={() => update('scrollMode', mode.value)}
			>
				{mode.label}
			</button>
		{/each}
	</div>
	<p class="text-base-400 dark:text-base-500 text-xs">
		{modes.find((m) => m.value === scrollMode)?.hint}
	</p>
</section>
