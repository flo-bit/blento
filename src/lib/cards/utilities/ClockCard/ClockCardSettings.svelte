<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Button } from '@foxui/core';
	import type { ClockCardData } from './index';
	import { onMount } from 'svelte';
	import { SettingsSection, SettingsField } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

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
			item.cardData.timezone = localTimezone();
		}
	});

	function localTimezone() {
		try {
			return Intl.DateTimeFormat().resolvedOptions().timeZone;
		} catch {
			return 'UTC';
		}
	}
</script>

<SettingsSection title="Timezone">
	<SettingsField label="Show time for">
		<div class="flex gap-2">
			<select
				value={cardData.timezone || 'UTC'}
				onchange={(e) => (item.cardData.timezone = e.currentTarget.value)}
				class="bg-base-100/50 dark:bg-base-900/50 ring-base-200 dark:ring-base-800 focus:ring-accent-500 rounded-ui text-base-900 dark:text-base-50 w-full min-w-0 flex-1 px-3 py-1.5 text-sm font-medium ring-1 transition-all outline-none ring-inset focus:ring-2"
			>
				{#each timezoneOptions as tz (tz.value)}
					<option value={tz.value}>{tz.label}</option>
				{/each}
			</select>
			<Button size="sm" variant="ghost" onclick={() => (item.cardData.timezone = localTimezone())}>
				Local
			</Button>
		</div>
	</SettingsField>
</SettingsSection>
