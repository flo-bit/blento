<script lang="ts">
	import { Alert, Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { parseBaserowFormUrl } from './baserow';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let url = $state('');
	let errorMessage = $state('');

	function validate(): boolean {
		errorMessage = '';
		const parsed = parseBaserowFormUrl(url);
		if (!parsed) {
			errorMessage =
				"That doesn't look like a Baserow form link (it should be a baserow.io/form/… URL).";
			return false;
		}
		item.cardData.href = parsed;
		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Paste your Baserow form link</Subheading>
	<p class="text-base-500 dark:text-base-400 text-sm">
		In Baserow, open your table's Form view, click <strong>Share form</strong>, and copy the public
		link.
	</p>
	<Input bind:value={url} placeholder="https://baserow.io/form/…" />

	{#if errorMessage}
		<Alert type="error" title="Failed to create form card"><span>{errorMessage}</span></Alert>
	{/if}

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button
			onclick={() => {
				if (validate()) oncreate();
			}}
		>
			Create</Button
		>
	</div>
</Modal>
