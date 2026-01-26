<script lang="ts">
	import { Button } from '@foxui/core';
	import { Timer, TimerState } from '@foxui/time';
	import NumberFlow, { NumberFlowGroup } from '@number-flow/svelte';
	import type { ContentComponentProps } from '../types';
	import type { TimerCardData } from './index';
	import { onMount } from 'svelte';

	let { item, isEditing }: ContentComponentProps = $props();

	let cardData = $derived(item.cardData as TimerCardData);

	// For timer mode
	let timer = $state(new TimerState(cardData.duration ?? 1000 * 60 * 5));

	// For clock and event modes - current time
	let now = $state(new Date());

	onMount(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 1000);
		return () => clearInterval(interval);
	});

	// Clock mode: get time parts for timezone
	let clockParts = $derived.by(() => {
		if (cardData.mode !== 'clock') return null;
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

	// Event mode: countdown to target date
	let eventDiff = $derived.by(() => {
		if (cardData.mode !== 'event' || !cardData.targetDate) return null;
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

	let isEventComplete = $derived(cardData.mode === 'event' && eventDiff === 0);

	// Get timezone display name
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

<div class="flex h-full w-full flex-col items-center justify-center p-4">
	<!-- Label -->
	{#if cardData.label}
		<div
			class="text-base-600 dark:text-base-400 accent:text-base-700 mb-1 text-center text-sm font-medium"
		>
			{cardData.label}
		</div>
	{/if}

	<!-- Clock Mode -->
	{#if cardData.mode === 'clock'}
		<NumberFlowGroup>
			<div
				class="text-base-900 dark:text-base-100 accent:text-base-900 flex items-center text-4xl font-bold"
				style="font-variant-numeric: tabular-nums;"
			>
				<NumberFlow value={clockHours} format={{ minimumIntegerDigits: 2 }} />
				<span class="text-base-400 dark:text-base-500 mx-0.5">:</span>
				<NumberFlow
					value={clockMinutes}
					format={{ minimumIntegerDigits: 2 }}
					digits={{ 1: { max: 5 } }}
				/>
				<span class="text-base-400 dark:text-base-500 mx-0.5">:</span>
				<NumberFlow
					value={clockSeconds}
					format={{ minimumIntegerDigits: 2 }}
					digits={{ 1: { max: 5 } }}
				/>
			</div>
		</NumberFlowGroup>
		{#if timezoneDisplay}
			<div class="text-base-500 dark:text-base-400 accent:text-base-600 mt-1 text-xs">
				{timezoneDisplay}
			</div>
		{/if}

		<!-- Timer Mode -->
	{:else if cardData.mode === 'timer'}
		<Timer
			bind:timer
			showHours
			showMinutes
			showSeconds
			class="text-base-900 dark:text-base-100 accent:text-base-900 text-4xl"
		/>
		{#if isEditing}
			<div class="mt-3 flex gap-2">
				{#if timer.isStopped}
					<Button size="sm" onclick={() => timer.start()}>Start</Button>
				{:else if timer.isRunning}
					<Button size="sm" variant="secondary" onclick={() => timer.pause()}>Pause</Button>
				{:else if timer.isPaused}
					<Button size="sm" onclick={() => timer.resume()}>Resume</Button>
				{/if}
				{#if !timer.isStopped}
					<Button size="sm" variant="ghost" onclick={() => timer.reset()}>Reset</Button>
				{/if}
			</div>
		{/if}

		<!-- Event Countdown Mode -->
	{:else if cardData.mode === 'event'}
		{#if eventDiff !== null && !isEventComplete}
			<NumberFlowGroup>
				<div
					class="text-base-900 dark:text-base-100 accent:text-base-900 flex items-baseline gap-3 text-center"
					style="font-variant-numeric: tabular-nums;"
				>
					{#if eventDays > 0}
						<div class="flex flex-col items-center">
							<NumberFlow value={eventDays} trend={-1} class="text-4xl font-bold" />
							<span class="text-base-500 dark:text-base-400 text-xs">days</span>
						</div>
					{/if}
					<div class="flex flex-col items-center">
						<NumberFlow
							value={eventHours}
							trend={-1}
							format={{ minimumIntegerDigits: 2 }}
							class="text-4xl font-bold"
						/>
						<span class="text-base-500 dark:text-base-400 text-xs">hrs</span>
					</div>
					<div class="flex flex-col items-center">
						<NumberFlow
							value={eventMinutes}
							trend={-1}
							format={{ minimumIntegerDigits: 2 }}
							digits={{ 1: { max: 5 } }}
							class="text-4xl font-bold"
						/>
						<span class="text-base-500 dark:text-base-400 text-xs">min</span>
					</div>
					<div class="flex flex-col items-center">
						<NumberFlow
							value={eventSeconds}
							trend={-1}
							format={{ minimumIntegerDigits: 2 }}
							digits={{ 1: { max: 5 } }}
							class="text-4xl font-bold"
						/>
						<span class="text-base-500 dark:text-base-400 text-xs">sec</span>
					</div>
				</div>
			</NumberFlowGroup>
		{:else if isEventComplete}
			<div class="text-accent-600 dark:text-accent-400 accent:text-accent-900 text-2xl font-bold">
				Event Started!
			</div>
		{:else}
			<div class="text-base-500 text-sm">Set a target date in settings</div>
		{/if}
	{/if}
</div>
