<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Input } from '@foxui/core';
	import { SettingsSection, SettingsField } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Buttondown">
		<SettingsField
			label="Username"
			description="Your Buttondown username, found in your Buttondown account URL."
		>
			<Input
				bind:value={item.cardData.username}
				placeholder="your-newsletter"
				spellcheck={false}
				autocapitalize="off"
			/>
		</SettingsField>
	</SettingsSection>

	<SettingsSection title="Content">
		<SettingsField label="Title">
			<Input bind:value={item.cardData.title} placeholder="Subscribe" />
		</SettingsField>
		<SettingsField label="Description">
			<Input
				bind:value={item.cardData.description}
				placeholder="Get updates straight to your inbox."
			/>
		</SettingsField>
	</SettingsSection>

	<SettingsSection title="Form">
		<SettingsField label="Email placeholder">
			<Input bind:value={item.cardData.placeholder} placeholder="you@example.com" />
		</SettingsField>
		<SettingsField label="Button text">
			<Input bind:value={item.cardData.buttonText} placeholder="Subscribe" />
		</SettingsField>
		<SettingsField
			label="Success message"
			description="Shown to visitors after they submit the form."
		>
			<Input
				bind:value={item.cardData.successMessage}
				placeholder="Thanks! Check your inbox to confirm."
			/>
		</SettingsField>
	</SettingsSection>
</div>
