<script lang="ts">
	import { Alert, Button, Subheading } from '@foxui/core';
	import type { SettingsComponentProps } from '../../types';
	import { parseVCard, generateVCard, parseVCardName, emptyVCardFields, type VCardFields } from '.';

	let { item = $bindable(), onclose }: SettingsComponentProps = $props();

	let mode: 'easy' | 'expert' = $state('easy');
	let fields: VCardFields = $state(
		parseVCard(item.cardData.vcard || '') || { ...emptyVCardFields }
	);

	function syncFromFields() {
		item.cardData.vcard = generateVCard(fields);
		item.cardData.displayName = parseVCardName(item.cardData.vcard);
	}

	function handleTextarea(e: Event) {
		const text = (e.target as HTMLTextAreaElement).value;
		item.cardData.vcard = text;
		item.cardData.displayName = parseVCardName(text);
		fields = parseVCard(text);
	}
</script>

<div class="flex w-72 flex-col gap-3 p-2">
	<Subheading>Edit vCard</Subheading>

	<Alert type="info" title="Privacy">
		<p class="text-xs">All data is public, be aware.</p>
	</Alert>

	<div class="flex items-center gap-2 text-xs">
		<button
			class={[
				'rounded px-2 py-1',
				mode === 'easy' ? 'bg-accent-500 text-white' : 'bg-base-200 dark:bg-base-700'
			]}
			onclick={() => (mode = 'easy')}
		>
			Easy
		</button>
		<button
			class={[
				'rounded px-2 py-1',
				mode === 'expert' ? 'bg-accent-500 text-white' : 'bg-base-200 dark:bg-base-700'
			]}
			onclick={() => (mode = 'expert')}
		>
			Expert
		</button>
		<a
			href="https://wikipedia.org/wiki/VCard"
			target="_blank"
			class="text-accent-600 dark:text-accent-400 underline">Learn about the vCard format</a
		>
	</div>

	{#if mode === 'easy'}
		<div class="flex flex-col gap-1 text-xs">
			<div class="grid grid-cols-2 gap-1">
				<input
					bind:value={fields.firstName}
					oninput={syncFromFields}
					placeholder="First name"
					class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 rounded border px-2 py-1"
				/>
				<input
					bind:value={fields.lastName}
					oninput={syncFromFields}
					placeholder="Last name"
					class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 rounded border px-2 py-1"
				/>
			</div>
			<input
				bind:value={fields.org}
				oninput={syncFromFields}
				placeholder="Organization"
				class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 rounded border px-2 py-1"
			/>
			<input
				bind:value={fields.title}
				oninput={syncFromFields}
				placeholder="Job title"
				class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 rounded border px-2 py-1"
			/>
			<input
				bind:value={fields.email}
				oninput={syncFromFields}
				placeholder="Email"
				type="email"
				class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 rounded border px-2 py-1"
			/>
			<input
				bind:value={fields.bday}
				oninput={syncFromFields}
				placeholder="Birthday"
				type="date"
				class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 rounded border px-2 py-1"
			/>
			<input
				bind:value={fields.website}
				oninput={syncFromFields}
				placeholder="Website"
				type="url"
				class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 rounded border px-2 py-1"
			/>
			<input
				bind:value={fields.address}
				oninput={syncFromFields}
				placeholder="Address"
				class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 rounded border px-2 py-1"
			/>
		</div>
	{:else}
		<textarea
			class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 h-40 w-full resize-none rounded border p-2 font-mono text-xs focus:outline-none"
			value={item.cardData.vcard || ''}
			oninput={handleTextarea}
			placeholder="BEGIN:VCARD
VERSION:4.0
FN:John Doe
END:VCARD"
		></textarea>
	{/if}

	<Button onclick={onclose} size="sm">Done</Button>
</div>
