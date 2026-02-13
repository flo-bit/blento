<script lang="ts">
	import { Alert, Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let url = $state('');
	let errorMessage = $state('');

	function checkUrl() {
		errorMessage = '';
		const match = url.match(/^https?:\/\/semble\.so\/profile\/([^/]+)\/collections\/([a-z0-9]+)$/);
		if (!match) {
			errorMessage = 'Please enter a valid Semble collection URL.';
			return false;
		}

		item.cardData.handle = match[1];
		item.cardData.collectionRkey = match[2];
		item.cardData.href = url;
		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Enter a Semble collection URL</Subheading>
	<Input bind:value={url} placeholder="https://semble.so/profile/.../collections/..." />

	{#if errorMessage}
		<Alert type="error" title="Invalid URL"><span>{errorMessage}</span></Alert>
	{/if}

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button
			onclick={() => {
				if (checkUrl()) oncreate();
			}}
		>
			Create
		</Button>
	</div>
</Modal>
