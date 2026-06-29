<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { SettingsSection, SettingsField, SettingsSegmented } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	const layoutOptions = [
		{ value: 'grid', label: 'Grid' },
		{ value: 'cinema', label: 'Cinema' }
	];

	const shapeOptions = [
		{ value: 'square', label: 'Square' },
		{ value: 'circle', label: 'Circle' }
	];
</script>

<SettingsSection title="Appearance">
	<SettingsField label="Layout">
		<SettingsSegmented
			options={layoutOptions}
			bind:value={() => item.cardData.layout ?? 'grid', (value) => (item.cardData.layout = value)}
		/>
	</SettingsField>
	<SettingsField label="Shape">
		<SettingsSegmented
			options={shapeOptions}
			bind:value={() => item.cardData.shape ?? 'square', (value) => (item.cardData.shape = value)}
		/>
	</SettingsField>
</SettingsSection>
