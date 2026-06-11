<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Textarea } from '@foxui/core';
	import {
		SettingsSection,
		SettingsField,
		SettingsImagePicker,
		SettingsLinkField
	} from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Image">
		<SettingsImagePicker bind:dict={item.cardData} key="image" layout="button" />
		<SettingsField label="Alt text" description="Describes the image for screen readers.">
			<Textarea
				variant="secondary"
				sizeVariant="sm"
				rows={3}
				bind:value={item.cardData.alt}
				placeholder="Describe the image"
			/>
		</SettingsField>
	</SettingsSection>

	<SettingsSection title="Link">
		<SettingsLinkField
			bind:dict={item.cardData}
			hrefKey="href"
			toggleLabel="Link this card to a URL"
			toggleDescription="Opens the link when the card is clicked."
		/>
	</SettingsSection>
</div>
