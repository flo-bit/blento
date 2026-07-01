<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { SettingsSection, SettingsSegmented } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	const modeOptions = [
		{ value: 'emoji', label: 'Emoji' },
		{ value: 'statusphere', label: 'Statusphere' }
	];
</script>

<SettingsSection title="Mode" description="Pick a single emoji, or sync your Statusphere status.">
	<SettingsSegmented
		options={modeOptions}
		bind:value={() => item.cardData.mode ?? 'emoji', (value) => (item.cardData.mode = value)}
	/>
</SettingsSection>
