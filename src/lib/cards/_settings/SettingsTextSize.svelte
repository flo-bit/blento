<script lang="ts">
	import { Button } from '@foxui/core';

	let {
		value = $bindable(),
		min = 0,
		max,
		fallback = 0
	}: {
		value: number | undefined;
		min?: number;
		max: number;
		fallback?: number;
	} = $props();

	const current = $derived(value ?? fallback);
	const steps = $derived(max - min + 1);

	function set(next: number) {
		value = Math.min(Math.max(next, min), max);
	}
</script>

<div class="bg-base-200/20 dark:bg-base-800/20 rounded-ui flex items-center gap-2 px-1.5 py-1">
	<Button
		variant="ghost"
		size="icon"
		class="size-7 shrink-0"
		disabled={current <= min}
		aria-label="Decrease text size"
		onclick={() => set(current - 1)}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="size-4"
		>
			<path d="m14 12 4 4 4-4" />
			<path d="M18 16V7" />
			<path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />
			<path d="M3.304 13h6.392" />
		</svg>
	</Button>

	<div class="flex flex-1 items-center justify-center gap-1">
		{#each Array(steps) as _, i (i)}
			<button
				type="button"
				class="group flex flex-1 cursor-pointer items-center py-1.5"
				aria-label={`Set text size ${i + 1}`}
				aria-pressed={i === current - min}
				onclick={() => set(min + i)}
			>
				<span
					class={[
						'h-1.5 w-full rounded-full transition-colors',
						i <= current - min
							? 'bg-accent-500'
							: 'bg-base-300/80 dark:bg-base-700 group-hover:bg-base-400 dark:group-hover:bg-base-600'
					]}
				></span>
			</button>
		{/each}
	</div>

	<Button
		variant="ghost"
		size="icon"
		class="size-7 shrink-0"
		disabled={current >= max}
		aria-label="Increase text size"
		onclick={() => set(current + 1)}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="size-4"
		>
			<path d="m14 11 4-4 4 4" />
			<path d="M18 16V7" />
			<path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />
			<path d="M3.304 13h6.392" />
		</svg>
	</Button>
</div>
