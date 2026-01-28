<script lang="ts">
	import '../app.css';

	import { ThemeToggle, Toaster, toast } from '@foxui/core';
	import { onMount } from 'svelte';
	import { initClient } from '$lib/atproto';
	import YoutubeVideoPlayer, { videoPlayer } from '$lib/components/YoutubeVideoPlayer.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import LoginModal from '$lib/atproto/UI/LoginModal.svelte';

	let { children } = $props();

	const errorMessages: Record<string, (params: URLSearchParams) => string> = {
		handle_not_found: (p) => `Handle ${p.get('handle') ?? ''} not found!`
	};

	onMount(() => {
		initClient();

		const error = page.url.searchParams.get('error');
		if (error) {
			const msg = errorMessages[error]?.(page.url.searchParams) ?? error;
			toast.error(msg);
			goto(page.url.pathname, { replaceState: true });
		}
	});
</script>

{@render children()}

<ThemeToggle class="fixed top-2 left-2 z-10" />
<Toaster />

{#if videoPlayer.id}
	<YoutubeVideoPlayer />
{/if}

<LoginModal />
