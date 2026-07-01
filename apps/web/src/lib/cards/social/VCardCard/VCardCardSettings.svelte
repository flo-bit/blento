<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Alert, Input, Textarea } from '@foxui/core';
	import { parseVCard, generateVCard, parseVCardName, emptyVCardFields, type VCardFields } from '.';
	import { SettingsSection, SettingsField, SettingsSegmented } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	let mode = $state<'easy' | 'expert'>('easy');
	let fields: VCardFields = $state(
		parseVCard(item.cardData.vcard || '') || { ...emptyVCardFields }
	);

	const modeOptions: { value: 'easy' | 'expert'; label: string }[] = [
		{ value: 'easy', label: 'Easy' },
		{ value: 'expert', label: 'Expert' }
	];

	function syncFromFields() {
		item.cardData.vcard = generateVCard(fields);
		item.cardData.displayName = parseVCardName(item.cardData.vcard);
	}

	function handleTextarea(value: string) {
		item.cardData.vcard = value;
		item.cardData.displayName = parseVCardName(value);
		fields = parseVCard(value);
	}
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Contact card">
		<SettingsSegmented options={modeOptions} bind:value={mode} />
		<Alert type="info" title="Public">
			<p class="text-xs">All vCard data is public — don't add anything private.</p>
		</Alert>
	</SettingsSection>

	{#if mode === 'easy'}
		<SettingsSection title="Details">
			<div class="grid grid-cols-2 gap-2">
				<Input bind:value={fields.firstName} oninput={syncFromFields} placeholder="First name" />
				<Input bind:value={fields.lastName} oninput={syncFromFields} placeholder="Last name" />
			</div>
			<SettingsField label="Organization">
				<Input bind:value={fields.org} oninput={syncFromFields} placeholder="Organization" />
			</SettingsField>
			<SettingsField label="Job title">
				<Input bind:value={fields.title} oninput={syncFromFields} placeholder="Job title" />
			</SettingsField>
			<SettingsField label="Email">
				<Input
					type="email"
					bind:value={fields.email}
					oninput={syncFromFields}
					placeholder="Email"
				/>
			</SettingsField>
			<SettingsField label="Birthday">
				<Input type="date" bind:value={fields.bday} oninput={syncFromFields} />
			</SettingsField>
			<SettingsField label="Website">
				<Input
					type="url"
					bind:value={fields.website}
					oninput={syncFromFields}
					placeholder="Website"
				/>
			</SettingsField>
			<SettingsField label="Address">
				<Input bind:value={fields.address} oninput={syncFromFields} placeholder="Address" />
			</SettingsField>
		</SettingsSection>
	{:else}
		<SettingsSection title="vCard source">
			<Textarea
				variant="secondary"
				sizeVariant="sm"
				rows={8}
				value={item.cardData.vcard || ''}
				oninput={(e) => handleTextarea(e.currentTarget.value)}
				placeholder="BEGIN:VCARD
VERSION:4.0
FN:John Doe
END:VCARD"
				class="font-mono"
			/>
		</SettingsSection>
	{/if}
</div>
