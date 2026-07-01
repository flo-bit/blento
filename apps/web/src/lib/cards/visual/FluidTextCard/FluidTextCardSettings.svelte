<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Input } from '@foxui/core';
	import { SettingsSection, SettingsField } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	if (item.cardData.fontSize === undefined) {
		item.cardData.fontSize = 0.33;
	}

	const displayPercent = $derived(Math.round((parseFloat(item.cardData.fontSize) as number) * 100));
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Content">
		<SettingsField label="Text">
			<Input bind:value={item.cardData.text} placeholder="Enter text" class="w-full" />
		</SettingsField>
	</SettingsSection>

	<SettingsSection title="Size">
		<SettingsField label={`Font size (${displayPercent}%)`}>
			<input
				type="range"
				min="0.1"
				max="0.8"
				step="0.01"
				value={parseFloat(item.cardData.fontSize) ?? 0.33}
				oninput={(e) => {
					item.cardData.fontSize = e.currentTarget.value.toString();
				}}
				class="accent-accent-500 bg-base-200 dark:bg-base-700 h-2 w-full cursor-pointer appearance-none rounded-lg"
			/>
		</SettingsField>
	</SettingsSection>
</div>
