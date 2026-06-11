<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Input } from '@foxui/core';
	import type { CountdownCardData } from './index';
	import { SettingsSection, SettingsField } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	let cardData = $derived(item.cardData as CountdownCardData);

	const pad = (n: number) => String(n).padStart(2, '0');

	let datetimeValue = $derived.by(() => {
		if (!cardData.targetDate) return '';
		const d = new Date(cardData.targetDate);
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	});

	function updateTargetDate(value: string) {
		if (!value) {
			item.cardData.targetDate = undefined;
			return;
		}
		item.cardData.targetDate = new Date(value).toISOString();
	}
</script>

<SettingsSection title="Target">
	<SettingsField label="Date & time">
		<Input
			type="datetime-local"
			class="w-full"
			value={datetimeValue}
			onchange={(e) => updateTargetDate(e.currentTarget.value)}
		/>
	</SettingsField>
</SettingsSection>
