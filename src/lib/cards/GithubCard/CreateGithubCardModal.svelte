<script lang="ts">
	import { Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');

	function validateUsername() {
		errorMessage = '';
		const username = item.cardData.username?.trim();

		if (!username) {
			errorMessage = 'Please enter a username';
			return false;
		}

		// Remove @ if present
		if (username.startsWith('@')) {
			item.cardData.username = username.slice(1);
		}

		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>GitHub Username</Subheading>
	<Input bind:value={item.cardData.username} placeholder="username" />

	<div class="mt-2">
		<Subheading>Display Name (optional)</Subheading>
		<Input bind:value={item.cardData.displayName} placeholder="Display Name" />
	</div>

	<div class="mt-2">
		<Subheading>Bio (optional)</Subheading>
		<Input bind:value={item.cardData.bio} placeholder="Short bio" />
	</div>

	{#if errorMessage}
		<p class="text-red-500 mt-2 text-sm">{errorMessage}</p>
	{/if}

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button
			onclick={() => {
				if (validateUsername()) oncreate();
			}}>Create</Button
		>
	</div>
</Modal>
