<script lang="ts">
	import { Alert, Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { toPlyrFMEmbedUrl, toPlyrFMCollectionEmbedUrl } from './index';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');

	function checkUrl() {
		errorMessage = '';

		const embedUrl = toPlyrFMEmbedUrl(item.cardData.href);

		if (!embedUrl) {
			errorMessage = 'Please enter a valid plyr.fm URL (track, playlist, or album)';
			return false;
		}

		item.cardData.href = embedUrl;

		// resize to collection dimensions if it's a playlist or album
		if (toPlyrFMCollectionEmbedUrl(item.cardData.href)) {
			item.h = 5;
			item.mobileH = 10;
		}

		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Enter a Plyr.fm URL</Subheading>
	<Input
		bind:value={item.cardData.href}
		placeholder="https://plyr.fm/track/... or /playlist/... or /u/.../album/..."
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
