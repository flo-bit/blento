<script lang="ts">
	import { Alert, Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { detectPlatform, platformsData } from '.';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');

	function handleCreate() {
		errorMessage = '';

		try {
			new URL(item.cardData.href);
		} catch {
			errorMessage = 'Please enter a valid URL';
			return;
		}

		const platform = detectPlatform(item.cardData.href);
		if (!platform) {
			errorMessage = 'Could not detect social media platform from URL';
			return;
		}

		item.cardData.platform = platform;
		item.cardData.color = platformsData[platform].hex;

		oncreate();
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Enter a social media link</Subheading>
	<Input
		bind:value={item.cardData.href}
		placeholder="https://instagram.com/username"
		onkeydown={(e) => {
			if (e.key === 'Enter') handleCreate();
		}}
	/>

	<p class="text-base-500 mt-2 text-sm">
		Supported: Instagram, Facebook, X/Twitter, YouTube, TikTok, LinkedIn, Bluesky, Threads,
		Snapchat, Pinterest, Twitch, Discord, GitHub, Spotify, Reddit, WhatsApp, Telegram, Mastodon
	</p>

	{#if errorMessage}
		<Alert type="error" title="Error"><span>{errorMessage}</span></Alert>
	{/if}

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button onclick={handleCreate}>Create</Button>
	</div>
</Modal>
