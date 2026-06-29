<script lang="ts">
	import { onMount } from 'svelte';
	import AtmoEmbed from '$lib/embed/AtmoEmbed.svelte';
	import { user } from '$lib/atproto';

	let origin = $state('');
	let lastNotify = $state<{ name: string; payload: unknown; at: number } | null>(null);

	onMount(() => {
		origin = window.location.origin;
	});
</script>

<svelte:head>
	<title>Embed SDK · v0 test</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-4 p-6">
	<header class="space-y-1">
		<h1 class="text-xl font-semibold">Embed SDK · v0 test</h1>
		<p class="text-sm opacity-70">
			Hosts <code>/embed/v0/test.html</code> via the <code>AtmoEmbed</code> component. Logged-in session
			is forwarded to the iframe.
		</p>
		<p class="text-sm opacity-70">
			Logged in as: <strong>{user.profile?.handle ?? user.did ?? 'not signed in'}</strong>
		</p>
		{#if lastNotify}
			<p class="text-sm opacity-70">
				Last notify: <code>{lastNotify.name}</code> ·
				<code>{JSON.stringify(lastNotify.payload)}</code>
			</p>
		{/if}
	</header>

	{#if origin}
		<AtmoEmbed
			{origin}
			path="/embed/v0/test.html"
			allowedCollectionPrefixes={['*']}
			height={700}
			title="Embed SDK test harness"
			class="w-full rounded-lg border border-black/10 dark:border-white/10"
			onnotify={(name, payload) => {
				lastNotify = { name, payload, at: Date.now() };
			}}
		/>
	{/if}
</main>
