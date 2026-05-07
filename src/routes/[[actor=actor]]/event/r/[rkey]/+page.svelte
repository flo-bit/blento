<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { EventView } from '@atmo-dev/events-ui';
	import { user } from '$lib/atproto';
	import { createBlentoEditorAdapter } from '$lib/events/adapter';

	let { data } = $props();

	let viewer = $derived({
		isLoggedIn: user.isLoggedIn,
		did: user.did ?? null,
		handle: user.profile?.handle,
		displayName: user.profile?.displayName,
		avatar: user.profile?.avatar
	});
	let adapter = $derived(createBlentoEditorAdapter({ viewer }));

	// Strip ?created=true from the URL after first paint so reloading doesn't
	// re-trigger the share modal.
	onMount(() => {
		const url = new URL(window.location.href);
		if (url.searchParams.has('created')) {
			url.searchParams.delete('created');
			history.replaceState(history.state, '', url.toString());
		}
	});
</script>

<svelte:head>
	<title>{data.eventData.name} · Blento</title>
	<meta property="og:title" content={data.eventData.name} />
	<meta property="og:type" content="article" />
	<meta property="og:image" content={data.ogImage} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={data.ogImage} />
</svelte:head>

<EventView
	{data}
	{adapter}
	{viewer}
	pageUrl={page.url}
	shareUrlOverride={data.shareUrl}
/>
