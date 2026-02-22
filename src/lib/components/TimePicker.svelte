<script lang="ts">
	// @ts-nocheck
	import { TimeField } from 'bits-ui';
	import { Time } from '@internationalized/date';
	import { untrack } from 'svelte';

	let {
		value = $bindable(''),
		required = false,
		locale = 'en'
	}: {
		value: string;
		required?: boolean;
		locale?: string;
	} = $props();

	let internalValue: Time | undefined = $state(undefined);

	function parseTimeStr(str: string): Time | undefined {
		if (!str) return undefined;
		const [hourStr, minuteStr] = str.split(':');
		const hour = parseInt(hourStr, 10);
		const minute = parseInt(minuteStr, 10);
		if (isNaN(hour) || isNaN(minute)) return undefined;
		return new Time(hour, minute);
	}

	function formatTimeStr(t: Time): string {
		const h = String(t.hour).padStart(2, '0');
		const m = String(t.minute).padStart(2, '0');
		return `${h}:${m}`;
	}

	$effect(() => {
		const parsed = parseTimeStr(value);
		untrack(() => {
			if (parsed) {
				if (
					!internalValue ||
					parsed.hour !== internalValue.hour ||
					parsed.minute !== internalValue.minute
				) {
					internalValue = parsed;
				}
			} else {
				internalValue = undefined;
			}
		});
	});

	function handleValueChange(newVal: Time | undefined) {
		if (newVal && newVal instanceof Time) {
			internalValue = newVal;
			value = formatTimeStr(newVal);
		}
	}
</script>

<TimeField.Root
	bind:value={internalValue}
	onValueChange={handleValueChange}
	granularity="minute"
	{locale}
	{required}
>
	<div
		class="border-base-300 bg-base-100 text-base-900 focus-within:border-accent-500 dark:border-base-700 dark:bg-base-800 dark:text-base-100 dark:focus-within:border-accent-400 flex items-center rounded-xl border px-2.5 py-1.5 text-sm transition-colors"
	>
		<TimeField.Input>
			{#snippet children({ segments })}
				{#each segments as segment, i (segment.part + i)}
					{#if segment.part === 'literal'}
						<span class="text-base-400 dark:text-base-500">{segment.value}</span>
					{:else}
						<TimeField.Segment
							part={segment.part}
							class="hover:bg-base-200 focus:bg-base-200 dark:hover:bg-base-700 dark:focus:bg-base-700 rounded px-0.5 focus:outline-none"
						>
							{segment.value}
						</TimeField.Segment>
					{/if}
				{/each}
			{/snippet}
		</TimeField.Input>

		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="text-base-400 dark:text-base-500 ml-auto size-4 pl-0.5"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
			/>
		</svg>
	</div>
</TimeField.Root>
