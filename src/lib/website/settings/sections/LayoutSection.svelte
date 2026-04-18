<script lang="ts">
	import type { WebsiteData } from '$lib/types';

	let { data = $bindable() }: { data: WebsiteData } = $props();

	type LayoutMode = NonNullable<WebsiteData['publication']['preferences']>['layoutMode'];

	type LayoutOption = {
		key: string;
		value: LayoutMode;
		label: string;
		description: string;
	};

	const options: LayoutOption[] = [
		{
			key: 'automatic',
			value: undefined,
			label: 'Automatic',
			description: 'Automatically syncs layouts until both are edited independently'
		},
		{
			key: 'desktop-leads',
			value: 'desktop-leads',
			label: 'Desktop drives mobile',
			description: 'Desktop edits update mobile, mobile edits are independent'
		},
		{
			key: 'mobile-leads',
			value: 'mobile-leads',
			label: 'Mobile drives desktop',
			description: 'Mobile edits update desktop, desktop edits are independent'
		},
		{
			key: 'independent',
			value: 'independent',
			label: 'Independent',
			description: 'Desktop and mobile layouts are fully independent'
		}
	];

	let selected = $derived(data.publication.preferences?.layoutMode ?? 'automatic');

	function selectOption(option: LayoutOption) {
		data.publication.preferences ??= {};
		data.publication.preferences.layoutMode = option.value;
		data = { ...data };
	}
</script>

<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Layout Sync</h3>
<p class="text-base-500 dark:text-base-400 mt-1 text-sm">
	Control how desktop and mobile layouts stay in sync.
</p>

<div class="mt-4 flex flex-col gap-2">
	{#each options as option (option.key)}
		{@const isSelected = option.key === (selected === undefined ? 'automatic' : selected)}
		<button
			type="button"
			class="border-base-200 dark:border-base-700 hover:border-base-300 dark:hover:border-base-600 cursor-pointer rounded-xl border-2 px-4 py-3 text-left transition-colors {isSelected
				? 'border-accent-500 bg-accent-50 dark:bg-accent-950/20'
				: 'bg-base-50 dark:bg-base-800/50'}"
			onclick={() => selectOption(option)}
		>
			<span
				class="text-sm font-semibold {isSelected
					? 'text-accent-700 dark:text-accent-300'
					: 'text-base-900 dark:text-base-100'}"
			>
				{option.label}
			</span>
			<p
				class="mt-0.5 text-xs {isSelected
					? 'text-accent-600 dark:text-accent-400'
					: 'text-base-500 dark:text-base-400'}"
			>
				{option.description}
			</p>
		</button>
	{/each}
</div>
