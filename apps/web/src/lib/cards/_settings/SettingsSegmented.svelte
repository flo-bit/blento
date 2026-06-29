<script lang="ts" generics="T extends string">
	type Option = { value: T; label: string };

	let {
		value = $bindable(),
		options,
		columns
	}: {
		value: T;
		options: Option[];
		columns?: number;
	} = $props();

	const cols = $derived(columns ?? Math.min(options.length, 3));
</script>

<div class="grid gap-2" style="grid-template-columns: repeat({cols}, minmax(0, 1fr));">
	{#each options as option (option.value)}
		{@const selected = value === option.value}
		<button
			type="button"
			class={[
				'cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
				selected
					? 'border-accent-500 bg-accent-500/10 text-accent-700 dark:text-accent-300'
					: 'border-base-200 dark:border-base-700 text-base-600 dark:text-base-300 hover:bg-base-100 dark:hover:bg-base-800'
			]}
			aria-pressed={selected}
			onclick={() => (value = option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>
