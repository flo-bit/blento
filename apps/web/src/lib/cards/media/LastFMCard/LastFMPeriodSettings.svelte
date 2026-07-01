<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Input } from '@foxui/core';
	import { SettingsSection, SettingsField, SettingsSegmented } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	const periodOptions = [
		{ value: '7day', label: '7 Days' },
		{ value: '1month', label: '1 Month' },
		{ value: '3month', label: '3 Months' },
		{ value: '6month', label: '6 Months' },
		{ value: '12month', label: '12 Months' },
		{ value: 'overall', label: 'All Time' }
	];
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Account">
		<SettingsField label="Last.fm username">
			<Input bind:value={item.cardData.lastfmUsername} placeholder="username" spellcheck={false} />
		</SettingsField>
	</SettingsSection>

	<SettingsSection title="Time period">
		<SettingsSegmented
			columns={3}
			options={periodOptions}
			bind:value={() => item.cardData.period ?? '7day', (value) => (item.cardData.period = value)}
		/>
	</SettingsSection>
</div>
