<script lang="ts">
	import NumberFlow, { NumberFlowGroup } from '@number-flow/svelte';
	import type { ContentComponentProps } from '../../types';
	import type { ClockCardData } from './index';
	import { onMount } from 'svelte';

	let { item }: ContentComponentProps = $props();

	let cardData = $derived(item.cardData as ClockCardData);

	let now = $state(new Date());

	onMount(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 1000);
		return () => clearInterval(interval);
	});

	let clockParts = $derived.by(() => {
		try {
			return new Intl.DateTimeFormat('en-US', {
				timeZone: cardData.timezone || 'UTC',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false
			}).formatToParts(now);
		} catch {
			return null;
		}
	});

	let clockHours = $derived(
		clockParts ? parseInt(clockParts.find((p) => p.type === 'hour')?.value || '0') : 0
	);
	let clockMinutes = $derived(
		clockParts ? parseInt(clockParts.find((p) => p.type === 'minute')?.value || '0') : 0
	);
	let clockSeconds = $derived(
		clockParts ? parseInt(clockParts.find((p) => p.type === 'second')?.value || '0') : 0
	);

	let timezoneDisplay = $derived.by(() => {
		if (!cardData.timezone) return '';
		try {
			const formatter = new Intl.DateTimeFormat('en-US', {
				timeZone: cardData.timezone,
				timeZoneName: 'short'
			});
			const parts = formatter.formatToParts(now);
			return parts.find((p) => p.type === 'timeZoneName')?.value || cardData.timezone;
		} catch {
			return cardData.timezone;
		}
	});
</script>

<div class="@container flex h-full w-full flex-col items-center justify-center p-4">
	<NumberFlowGroup>
		<div
			class="text-base-900 dark:text-base-100 accent:text-base-900 flex items-center text-3xl font-bold @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl"
			style="font-variant-numeric: tabular-nums;"
		>
			<NumberFlow value={clockHours} format={{ minimumIntegerDigits: 2 }} />
			<span class="text-base-400 dark:text-base-500 accent:text-accent-950 mx-0.5">:</span>
			<NumberFlow
				value={clockMinutes}
				format={{ minimumIntegerDigits: 2 }}
				digits={{ 1: { max: 5 } }}
				trend={1}
			/>
			<span class="text-base-400 dark:text-base-500 accent:text-accent-950 mx-0.5">:</span>
			<NumberFlow
				value={clockSeconds}
				format={{ minimumIntegerDigits: 2 }}
				digits={{ 1: { max: 5 } }}
				trend={1}
			/>
		</div>
	</NumberFlowGroup>
	{#if timezoneDisplay}
		<div class="text-base-500 dark:text-base-400 accent:text-base-600 mt-1 text-xs @sm:text-sm">
			{timezoneDisplay}
		</div>
	{/if}
</div>
