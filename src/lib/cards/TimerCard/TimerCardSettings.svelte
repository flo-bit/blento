<script lang="ts">
	import type { Item } from '$lib/types';
	import { Input, Label } from '@foxui/core';
	import type { TimerCardData, TimerMode } from './index';

	let { item }: { item: Item; onclose: () => void } = $props();

	let cardData = $derived(item.cardData as TimerCardData);

	const modeOptions = [
		{ value: 'clock', label: 'Clock', desc: 'Show current time' },
		{ value: 'timer', label: 'Timer', desc: 'Countdown timer' },
		{ value: 'event', label: 'Event', desc: 'Countdown to date' }
	];

	const timezoneOptions = [
		{ value: 'UTC', label: 'UTC' },
		{ value: 'America/New_York', label: 'New York' },
		{ value: 'America/Chicago', label: 'Chicago' },
		{ value: 'America/Denver', label: 'Denver' },
		{ value: 'America/Los_Angeles', label: 'Los Angeles' },
		{ value: 'Europe/London', label: 'London' },
		{ value: 'Europe/Paris', label: 'Paris' },
		{ value: 'Europe/Berlin', label: 'Berlin' },
		{ value: 'Asia/Tokyo', label: 'Tokyo' },
		{ value: 'Asia/Shanghai', label: 'Shanghai' },
		{ value: 'Asia/Dubai', label: 'Dubai' },
		{ value: 'Asia/Kolkata', label: 'Mumbai' },
		{ value: 'Australia/Sydney', label: 'Sydney' }
	];

	const durationOptions = [
		{ value: 1000 * 60, label: '1 minute' },
		{ value: 1000 * 60 * 5, label: '5 minutes' },
		{ value: 1000 * 60 * 10, label: '10 minutes' },
		{ value: 1000 * 60 * 15, label: '15 minutes' },
		{ value: 1000 * 60 * 30, label: '30 minutes' },
		{ value: 1000 * 60 * 60, label: '1 hour' }
	];

	// Parse target date for inputs
	let targetDateValue = $derived.by(() => {
		if (!cardData.targetDate) return '';
		return new Date(cardData.targetDate).toISOString().split('T')[0];
	});

	let targetTimeValue = $derived.by(() => {
		if (!cardData.targetDate) return '12:00';
		return new Date(cardData.targetDate).toTimeString().slice(0, 5);
	});

	function updateTargetDate(dateStr: string, timeStr: string) {
		if (!dateStr) return;
		item.cardData.targetDate = new Date(`${dateStr}T${timeStr}`).toISOString();
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Mode Selection -->
	<div class="flex flex-col gap-2">
		<Label>Mode</Label>
		<div class="grid grid-cols-3 gap-2">
			{#each modeOptions as opt (opt.value)}
				<button
					type="button"
					onclick={() => (item.cardData.mode = opt.value as TimerMode)}
					class={[
						'rounded-xl border px-3 py-2 text-left transition-colors',
						cardData.mode === opt.value
							? 'border-accent-500 bg-accent-500/10 text-accent-700 dark:text-accent-300'
							: 'border-base-300 dark:border-base-700 hover:bg-base-100 dark:hover:bg-base-800'
					]}
				>
					<div class="text-sm font-medium">{opt.label}</div>
					<div class="text-base-500 text-xs">{opt.desc}</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Label -->
	<div class="flex flex-col gap-2">
		<Label for="label">Label (optional)</Label>
		<Input
			id="label"
			value={cardData.label || ''}
			oninput={(e) => (item.cardData.label = e.currentTarget.value || undefined)}
			placeholder={cardData.mode === 'clock'
				? 'e.g. Tokyo Time'
				: cardData.mode === 'event'
					? 'e.g. New Year'
					: 'e.g. Focus Time'}
		/>
	</div>

	<!-- Clock Settings -->
	{#if cardData.mode === 'clock'}
		<div class="flex flex-col gap-2">
			<Label for="timezone">Timezone</Label>
			<select
				id="timezone"
				value={cardData.timezone || 'UTC'}
				onchange={(e) => (item.cardData.timezone = e.currentTarget.value)}
				class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 text-base-900 dark:text-base-100 rounded-xl border px-3 py-2"
			>
				{#each timezoneOptions as tz (tz.value)}
					<option value={tz.value}>{tz.label}</option>
				{/each}
			</select>
		</div>
	{/if}

	<!-- Timer Settings -->
	{#if cardData.mode === 'timer'}
		<div class="flex flex-col gap-2">
			<Label for="duration">Duration</Label>
			<select
				id="duration"
				value={cardData.duration || 1000 * 60 * 5}
				onchange={(e) => (item.cardData.duration = parseInt(e.currentTarget.value))}
				class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 text-base-900 dark:text-base-100 rounded-xl border px-3 py-2"
			>
				{#each durationOptions as dur (dur.value)}
					<option value={dur.value}>{dur.label}</option>
				{/each}
			</select>
		</div>
	{/if}

	<!-- Event Settings -->
	{#if cardData.mode === 'event'}
		<div class="flex flex-col gap-2">
			<Label>Target Date & Time</Label>
			<div class="flex gap-2">
				<Input
					type="date"
					value={targetDateValue}
					onchange={(e) => updateTargetDate(e.currentTarget.value, targetTimeValue)}
					class="flex-1"
				/>
				<Input
					type="time"
					value={targetTimeValue}
					onchange={(e) => updateTargetDate(targetDateValue, e.currentTarget.value)}
					class="w-28"
				/>
			</div>
		</div>
	{/if}
</div>
