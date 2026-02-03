<script lang="ts">
	import { Alert, Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');

	function checkUrl() {
		errorMessage = '';

		const pattern = /open\.spotify\.com\/(album|playlist)\/([a-zA-Z0-9]+)/;
		const match = item.cardData.href?.match(pattern);

		if (!match) {
			errorMessage = 'Please enter a valid Spotify album or playlist URL';
			return false;
		}

		item.cardData.spotifyType = match[1];
		item.cardData.spotifyId = match[2];

		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Enter a Spotify album or playlist URL</Subheading>
	<Input
		bind:value={item.cardData.href}
		placeholder="https://open.spotify.com/album/..."
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
