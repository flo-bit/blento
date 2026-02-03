<script lang="ts">
	import { Alert, Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');

	async function checkUrl() {
		errorMessage = '';
		try {
			new URL(item.cardData.href);
		} catch {
			errorMessage = 'Invalid URL!';
			return false;
		}

		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Enter a link to embed</Subheading>
	<Input bind:value={item.cardData.href} />

	{#if errorMessage}
		<Alert type="error" title="Failed to create embed card"><span>{errorMessage}</span></Alert>
	{/if}

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button
			onclick={async () => {
				if (await checkUrl()) oncreate();
			}}
		>
			Create</Button
		>
	</div>
</Modal>
