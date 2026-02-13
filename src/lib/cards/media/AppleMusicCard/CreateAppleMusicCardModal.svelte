<script lang="ts">
	import { Alert, Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');

	function checkUrl() {
		errorMessage = '';

		const pattern = /music\.apple\.com\/([a-z]{2})\/(album|playlist)\/[^/]+\/([a-zA-Z0-9.]+)/;
		const match = item.cardData.href?.match(pattern);

		if (!match) {
			errorMessage = 'Please enter a valid Apple Music album or playlist URL';
			return false;
		}

		item.cardData.appleMusicStorefront = match[1];
		item.cardData.appleMusicType = match[2];
		item.cardData.appleMusicId = match[3];

		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Enter an Apple Music album or playlist URL</Subheading>
	<Input
		bind:value={item.cardData.href}
		placeholder="https://music.apple.com/us/album/..."
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
