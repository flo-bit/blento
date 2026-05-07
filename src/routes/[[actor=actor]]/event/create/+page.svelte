<script lang="ts">
	import * as TID from '@atcute/tid';
	import { EventEditor } from '@atmo-dev/events-ui';
	import { user } from '$lib/atproto';
	import { createBlentoEditorAdapter } from '$lib/events/adapter';

	let viewer = $derived({
		isLoggedIn: user.isLoggedIn,
		did: user.did ?? null,
		handle: user.profile?.handle,
		displayName: user.profile?.displayName,
		avatar: user.profile?.avatar
	});
	let adapter = $derived(createBlentoEditorAdapter({ viewer }));

	// rkey is generated up-front; the editor uses it for both the in-progress
	// thumbnail seed and the eventual record location.
	const rkey = TID.now();
</script>

<svelte:head>
	<title>Create event · Blento</title>
</svelte:head>

<EventEditor
	{adapter}
	{viewer}
	{rkey}
	actorDid={viewer.did ?? ''}
	eventData={null}
/>
