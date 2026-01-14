<script lang="ts">
	import { Alert, Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');

	const platformPatterns: Record<string, RegExp> = {
		instagram: /(?:instagram\.com|instagr\.am)/i,
		facebook: /(?:facebook\.com|fb\.com|fb\.me)/i,
		twitter: /(?:twitter\.com)/i,
		x: /(?:x\.com)/i,
		youtube: /(?:youtube\.com|youtu\.be)/i,
		tiktok: /(?:tiktok\.com)/i,
		linkedin: /(?:linkedin\.com)/i,
		bluesky: /(?:bsky\.app|bsky\.social)/i,
		threads: /(?:threads\.net)/i,
		snapchat: /(?:snapchat\.com)/i,
		pinterest: /(?:pinterest\.com|pin\.it)/i,
		twitch: /(?:twitch\.tv)/i,
		discord: /(?:discord\.gg|discord\.com)/i,
		github: /(?:github\.com)/i,
		spotify: /(?:spotify\.com|open\.spotify\.com)/i,
		reddit: /(?:reddit\.com)/i,
		whatsapp: /(?:whatsapp\.com|wa\.me)/i,
		telegram: /(?:t\.me|telegram\.org)/i,
		mastodon: /(?:mastodon\.social|mastodon\.online|mstdn\.social)/i
	};

	const platformColors: Record<string, string> = {
		instagram: 'pink',
		facebook: 'blue',
		twitter: 'sky',
		x: 'zinc',
		youtube: 'red',
		tiktok: 'zinc',
		linkedin: 'blue',
		bluesky: 'sky',
		threads: 'zinc',
		snapchat: 'yellow',
		pinterest: 'red',
		twitch: 'purple',
		discord: 'indigo',
		github: 'zinc',
		spotify: 'green',
		reddit: 'orange',
		whatsapp: 'green',
		telegram: 'sky',
		mastodon: 'purple'
	};

	function detectPlatform(url: string): string | null {
		for (const [platform, pattern] of Object.entries(platformPatterns)) {
			if (pattern.test(url)) {
				return platform;
			}
		}
		return null;
	}

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
		item.color = platformColors[platform] || 'accent';
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
