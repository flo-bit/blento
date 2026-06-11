<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { validateLink } from '$lib/helpers/links';
	import { Button, Input, toast } from '@foxui/core';
	import {
		SettingsSection,
		SettingsField,
		SettingsToggle,
		SettingsImagePicker
	} from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	function stripProtocol(url: string) {
		return url.replace(/^https?:\/\//, '');
	}

	let urlInput = $state(stripProtocol(item.cardData.href ?? ''));

	function applyUrl() {
		const trimmed = urlInput.trim();
		if (!trimmed) {
			item.cardData.href = '';
			item.cardData.domain = '';
			return;
		}
		const link = validateLink(trimmed);
		if (!link) {
			toast.error('Invalid link');
			return;
		}
		item.cardData.href = link;
		item.cardData.domain = new URL(link).hostname;
		item.cardData.hasFetched = false;
		urlInput = stripProtocol(link);
	}

	function refetch() {
		if (!item.cardData.href) return;
		item.cardData.hasFetched = false;
	}
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Link">
		<SettingsField label="URL">
			<Input
				type="url"
				spellcheck={false}
				bind:value={urlInput}
				placeholder="example.com"
				onblur={applyUrl}
				onkeydown={(event) => {
					if (event.code === 'Enter') {
						event.preventDefault();
						applyUrl();
					}
				}}
			/>
		</SettingsField>
		<Button
			variant="secondary"
			size="sm"
			class="self-start"
			disabled={!item.cardData.href}
			onclick={refetch}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="mr-2 size-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
				/>
			</svg>
			Re-fetch info
		</Button>
	</SettingsSection>

	<SettingsSection title="Content">
		<SettingsField label="Title">
			<Input bind:value={item.cardData.title} placeholder="Link title" />
		</SettingsField>
	</SettingsSection>

	<SettingsSection title="Appearance">
		<SettingsField label="Icon">
			<SettingsImagePicker
				bind:dict={item.cardData}
				key="favicon"
				layout="compact"
				thumbClass="size-12"
				rounded="rounded-lg"
				removable
				changeLabel="Change icon"
				emptyLabel="Add icon"
			/>
		</SettingsField>

		<SettingsField label="Preview image">
			<SettingsImagePicker
				bind:dict={item.cardData}
				key="image"
				layout="compact"
				thumbClass="h-12 w-20"
				rounded="rounded-lg"
				removable
				changeLabel="Change"
				emptyLabel="Add image"
			/>
		</SettingsField>

		<SettingsToggle
			checked={Boolean(item.cardData.showBackgroundImage)}
			onCheckedChange={(value) => (item.cardData.showBackgroundImage = value)}
			label="Show as background image"
			description="Use the preview image as a full-card background."
		/>
	</SettingsSection>
</div>
