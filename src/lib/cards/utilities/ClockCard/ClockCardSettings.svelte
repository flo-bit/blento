<script lang="ts">
	import type { Item } from '$lib/types';
	import { Button, Label } from '@foxui/core';
	import type { ClockCardData } from './index';
	import { onMount } from 'svelte';

	let { item }: { item: Item; onclose: () => void } = $props();

	let cardData = $derived(item.cardData as ClockCardData);

	const timezoneOptions = [
		{ value: 'Pacific/Midway', label: 'UTC-11 (Midway)' },
		{ value: 'Pacific/Honolulu', label: 'UTC-10 (Honolulu)' },
		{ value: 'America/Anchorage', label: 'UTC-9 (Anchorage)' },
		{ value: 'America/Los_Angeles', label: 'UTC-8 (Los Angeles)' },
		{ value: 'America/Denver', label: 'UTC-7 (Denver)' },
		{ value: 'America/Chicago', label: 'UTC-6 (Chicago)' },
		{ value: 'America/New_York', label: 'UTC-5 (New York)' },
		{ value: 'America/Halifax', label: 'UTC-4 (Halifax)' },
		{ value: 'America/Sao_Paulo', label: 'UTC-3 (São Paulo)' },
		{ value: 'Atlantic/South_Georgia', label: 'UTC-2 (South Georgia)' },
		{ value: 'Atlantic/Azores', label: 'UTC-1 (Azores)' },
		{ value: 'UTC', label: 'UTC+0 (London)' },
		{ value: 'Europe/Paris', label: 'UTC+1 (Paris)' },
		{ value: 'Europe/Helsinki', label: 'UTC+2 (Helsinki)' },
		{ value: 'Europe/Moscow', label: 'UTC+3 (Moscow)' },
		{ value: 'Asia/Dubai', label: 'UTC+4 (Dubai)' },
		{ value: 'Asia/Karachi', label: 'UTC+5 (Karachi)' },
		{ value: 'Asia/Kolkata', label: 'UTC+5:30 (Mumbai)' },
		{ value: 'Asia/Dhaka', label: 'UTC+6 (Dhaka)' },
		{ value: 'Asia/Bangkok', label: 'UTC+7 (Bangkok)' },
		{ value: 'Asia/Shanghai', label: 'UTC+8 (Shanghai)' },
		{ value: 'Asia/Tokyo', label: 'UTC+9 (Tokyo)' },
		{ value: 'Australia/Sydney', label: 'UTC+10 (Sydney)' },
		{ value: 'Pacific/Noumea', label: 'UTC+11 (Noumea)' },
		{ value: 'Pacific/Auckland', label: 'UTC+12 (Auckland)' }
	];

	onMount(() => {
		if (!cardData.timezone) {
			try {
				item.cardData.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			} catch {
				item.cardData.timezone = 'UTC';
			}
		}
	});

	function useLocalTimezone() {
		try {
			item.cardData.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		} catch {
			item.cardData.timezone = 'UTC';
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-2">
		<Label>Timezone</Label>
		<div class="flex gap-2">
			<select
				value={cardData.timezone || 'UTC'}
				onchange={(e) => (item.cardData.timezone = e.currentTarget.value)}
				class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 text-base-900 dark:text-base-100 flex-1 rounded-xl border px-3 py-2"
			>
				{#each timezoneOptions as tz (tz.value)}
					<option value={tz.value}>{tz.label}</option>
				{/each}
			</select>
			<Button size="sm" variant="ghost" onclick={useLocalTimezone}>Local</Button>
		</div>
	</div>
</div>
