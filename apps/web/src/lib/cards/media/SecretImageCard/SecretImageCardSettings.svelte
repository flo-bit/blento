<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Input } from '@foxui/core';
	import { SettingsSection, SettingsField, SettingsImagePicker } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Image">
		<SettingsImagePicker
			bind:dict={item.cardData}
			key="rawImage"
			layout="button"
			changeLabel="Replace image"
			emptyLabel="Add image"
		/>
	</SettingsSection>

	<SettingsSection title="Password" description="Viewers need this password to reveal the image.">
		<SettingsField label="Password">
			<Input type="password" bind:value={item.cardData.password} placeholder="Enter password" />
		</SettingsField>
	</SettingsSection>
</div>
