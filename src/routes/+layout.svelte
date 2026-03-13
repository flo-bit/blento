<script lang="ts">
	import '../app.css';

	import { Tooltip } from 'bits-ui';
	import { ThemeToggle, Toaster, toast } from '@foxui/core';
	import { onMount } from 'svelte';
	import { initClient } from '$lib/atproto';
	import YoutubeVideoPlayer, { videoPlayer } from '$lib/components/YoutubeVideoPlayer.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { AtprotoLoginModal } from '@foxui/social';
	import { login, signup } from '$lib/atproto';
	import type { ActorIdentifier } from '@atcute/lexicons';

	let { children, data } = $props();
	let showThemeToggle = $derived(
		!/(?:\/card\/[^/]+|\/embed\/type\/[^/]+)$/.test(page.url.pathname)
	);

	const errorMessages: Record<string, (params: URLSearchParams) => string> = {
		handle_not_found: (p) => `Handle ${p.get('handle') ?? ''} not found!`
	};

	onMount(() => {
		initClient({ customDomain: data.customDomain });
	});
</script>

<Tooltip.Provider delayDuration={300}>
	{@render children()}
</Tooltip.Provider>

{#if showThemeToggle}
	<ThemeToggle class="fixed top-2 left-2 z-10" />
{/if}

<Toaster />

{#if videoPlayer.id}
	<YoutubeVideoPlayer />
{/if}

<AtprotoLoginModal
	login={async (handle) => {
		await login(handle as ActorIdentifier);
		return true;
	}}
	signup={async () => {
		await signup();
		return true;
	}}
/>
