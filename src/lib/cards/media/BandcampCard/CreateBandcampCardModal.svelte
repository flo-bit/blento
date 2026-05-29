<script lang="ts">
	import { Alert, Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { isBandcampUrl } from './shared';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');

	function checkUrl() {
		errorMessage = '';
		const url = item.cardData.href?.trim();

		if (!isBandcampUrl(url)) {
			errorMessage = 'Please enter a valid Bandcamp album or track URL';
			return false;
		}

		item.cardData.href = url;
		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Enter a Bandcamp album or track URL</Subheading>
	<Input
		bind:value={item.cardData.href}
		placeholder="https://artist.bandcamp.com/album/..."
		onkeydown={(e) => {
			if (e.key === 'Enter' && checkUrl()) oncreate();
		}}
	/>

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
