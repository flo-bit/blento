<script lang="ts">
	import NumberFlow, { NumberFlowGroup } from '@number-flow/svelte';
	import type { ContentComponentProps } from '../../types';
	import type { CountdownCardData } from './index';
	import { onMount } from 'svelte';

	let { item }: ContentComponentProps = $props();

	let cardData = $derived(item.cardData as CountdownCardData);

	let now = $state(new Date());

	onMount(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 1000);
		return () => clearInterval(interval);
	});

	// Countdown to target date
	let eventDiff = $derived.by(() => {
		if (!cardData.targetDate) return null;
		const target = new Date(cardData.targetDate);
		return Math.max(0, target.getTime() - now.getTime());
	});

	let eventDays = $derived(eventDiff !== null ? Math.floor(eventDiff / (1000 * 60 * 60 * 24)) : 0);
	let eventHours = $derived(
		eventDiff !== null ? Math.floor((eventDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : 0
	);
	let eventMinutes = $derived(
		eventDiff !== null ? Math.floor((eventDiff % (1000 * 60 * 60)) / (1000 * 60)) : 0
	);
	let eventSeconds = $derived(
		eventDiff !== null ? Math.floor((eventDiff % (1000 * 60)) / 1000) : 0
	);

	// Check if event is in the past (elapsed mode)
	let isEventPast = $derived.by(() => {
		if (!cardData.targetDate) return false;
		return now.getTime() > new Date(cardData.targetDate).getTime();
	});

	// Elapsed time since past event
	let elapsedDiff = $derived.by(() => {
		if (!isEventPast || !cardData.targetDate) return null;
		return now.getTime() - new Date(cardData.targetDate).getTime();
	});

	let elapsedYears = $derived(
		elapsedDiff !== null ? Math.floor(elapsedDiff / (1000 * 60 * 60 * 24 * 365)) : 0
	);
	let elapsedDays = $derived(
		elapsedDiff !== null
			? Math.floor((elapsedDiff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24))
			: 0
	);
	let elapsedHours = $derived(
		elapsedDiff !== null ? Math.floor((elapsedDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : 0
	);
	let elapsedMinutes = $derived(
		elapsedDiff !== null ? Math.floor((elapsedDiff % (1000 * 60 * 60)) / (1000 * 60)) : 0
	);
	let elapsedSeconds = $derived(
		elapsedDiff !== null ? Math.floor((elapsedDiff % (1000 * 60)) / 1000) : 0
	);
</script>

<div class="@container flex h-full w-full flex-col items-center justify-center p-4">
	{#if isEventPast && elapsedDiff !== null}
		<!-- Elapsed time since past event -->
		<NumberFlowGroup>
			<div
				class="text-base-900 dark:text-base-100 accent:text-base-900 flex items-baseline gap-4 text-center @sm:gap-6 @md:gap-8"
				style="font-variant-numeric: tabular-nums;"
			>
				{#if elapsedYears > 0}
					<div class="flex flex-col items-center">
						<NumberFlow
							value={elapsedYears}
							trend={1}
							class="text-3xl font-bold @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl"
						/>
						<span class="text-base-500 dark:text-base-400 accent:text-accent-950 text-xs"
							>{elapsedYears === 1 ? 'year' : 'years'}</span
						>
					</div>
				{/if}
				{#if elapsedYears > 0 || elapsedDays > 0}
					<div class="flex flex-col items-center">
						<NumberFlow
							value={elapsedDays}
							trend={1}
							class="text-3xl font-bold @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl"
						/>
						<span class="text-base-500 dark:text-base-400 accent:text-accent-950 text-xs"
							>{elapsedDays === 1 ? 'day' : 'days'}</span
						>
					</div>
				{/if}
				<div class="flex flex-col items-center">
					<NumberFlow
						value={elapsedHours}
						trend={1}
						format={{ minimumIntegerDigits: 2 }}
						class="text-3xl font-bold @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl"
					/>
					<span class="text-base-500 dark:text-base-400 accent:text-accent-950 text-xs">hrs</span>
				</div>
				<div class="flex flex-col items-center">
					<NumberFlow
						value={elapsedMinutes}
						trend={1}
						format={{ minimumIntegerDigits: 2 }}
						digits={{ 1: { max: 5 } }}
						class="text-3xl font-bold @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl"
					/>
					<span class="text-base-500 dark:text-base-400 accent:text-accent-950 text-xs">min</span>
				</div>
				<div class="flex flex-col items-center">
					<NumberFlow
						value={elapsedSeconds}
						trend={1}
						format={{ minimumIntegerDigits: 2 }}
						digits={{ 1: { max: 5 } }}
						class="text-3xl font-bold @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl"
					/>
					<span class="text-base-500 dark:text-base-400 accent:text-accent-950 text-xs">sec</span>
				</div>
			</div>
		</NumberFlowGroup>
	{:else if eventDiff !== null}
		<!-- Countdown to future event -->
		<NumberFlowGroup>
			<div
				class="text-base-900 dark:text-base-100 accent:text-base-900 flex items-baseline gap-4 text-center @sm:gap-6 @md:gap-8"
				style="font-variant-numeric: tabular-nums;"
			>
				{#if eventDays > 0}
					<div class="flex flex-col items-center">
						<NumberFlow
							value={eventDays}
							trend={-1}
							class="text-3xl font-bold @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl"
						/>
						<span class="text-base-500 dark:text-base-400 accent:text-accent-950 text-xs"
							>{eventDays === 1 ? 'day' : 'days'}</span
						>
					</div>
				{/if}
				<div class="flex flex-col items-center">
					<NumberFlow
						value={eventHours}
						trend={-1}
						format={{ minimumIntegerDigits: 2 }}
						class="text-3xl font-bold @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl"
					/>
					<span class="text-base-500 dark:text-base-400 accent:text-accent-950 text-xs">hrs</span>
				</div>
				<div class="flex flex-col items-center">
					<NumberFlow
						value={eventMinutes}
						trend={-1}
						format={{ minimumIntegerDigits: 2 }}
						digits={{ 1: { max: 5 } }}
						class="text-3xl font-bold @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl"
					/>
					<span class="text-base-500 dark:text-base-400 accent:text-accent-950 text-xs">min</span>
				</div>
				<div class="flex flex-col items-center">
					<NumberFlow
						value={eventSeconds}
						trend={-1}
						format={{ minimumIntegerDigits: 2 }}
						digits={{ 1: { max: 5 } }}
						class="text-3xl font-bold @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl"
					/>
					<span class="text-base-500 dark:text-base-400 accent:text-accent-950 text-xs">sec</span>
				</div>
			</div>
		</NumberFlowGroup>
	{:else}
		<div class="text-base-500 text-sm">Set a target date in settings</div>
	{/if}
</div>
