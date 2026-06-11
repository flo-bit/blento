<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Button } from '@foxui/core';
	import { SettingsSection, SettingsLinkField } from '../../_settings';
	import CreateBlueskyMediaCardModal from './CreateBlueskyMediaCardModal.svelte';

	let { item = $bindable() }: SettingsComponentProps = $props();

	let pickerOpen = $state(false);
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Media">
		<Button variant="secondary" class="w-full justify-start" onclick={() => (pickerOpen = true)}>
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
					d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z"
				/>
			</svg>
			Change media
		</Button>
	</SettingsSection>

	<SettingsSection title="Link">
		<SettingsLinkField
			bind:dict={item.cardData}
			hrefKey="href"
			labelKey="hrefText"
			toggleLabel="Link this card to a URL"
			toggleDescription="Opens the link when the card is clicked."
		/>
	</SettingsSection>
</div>

{#if pickerOpen}
	<CreateBlueskyMediaCardModal
		bind:item
		oncreate={() => (pickerOpen = false)}
		oncancel={() => (pickerOpen = false)}
	/>
{/if}
