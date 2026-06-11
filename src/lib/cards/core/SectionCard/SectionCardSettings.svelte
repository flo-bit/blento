<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Input } from '@foxui/core';
	import { textSizeClasses } from './styles';
	import {
		SettingsSection,
		SettingsField,
		SettingsAlignToggle,
		SettingsTextSize
	} from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Content">
		<SettingsField label="Heading">
			<Input bind:value={item.cardData.text} placeholder="Heading text" />
		</SettingsField>
	</SettingsSection>

	<SettingsSection title="Alignment">
		<SettingsField label="Vertical">
			<SettingsAlignToggle
				type="vertical"
				fallback="center"
				bind:value={item.cardData.verticalAlign}
			/>
		</SettingsField>
		<SettingsField label="Horizontal">
			<SettingsAlignToggle type="horizontal" fallback="left" bind:value={item.cardData.textAlign} />
		</SettingsField>
	</SettingsSection>

	<SettingsSection title="Text size">
		<SettingsTextSize
			min={0}
			max={textSizeClasses.length - 1}
			fallback={1}
			bind:value={item.cardData.textSize}
		/>
	</SettingsSection>
</div>
