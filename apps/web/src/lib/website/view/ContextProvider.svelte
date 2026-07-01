<script lang="ts">
	import type { WebsiteData } from '$lib/types';
	import type { Snippet } from 'svelte';
	import {
		setAdditionalUserData,
		setLoadedData,
		setCanEdit,
		setDidContext,
		setHandleContext
	} from '../data/context';
	import { dev } from '$app/environment';
	import { user } from '$lib/atproto';
	import type { Did, Handle } from '@atcute/lexicons';

	let {
		data,
		children,
		isEditing
	}: {
		data: WebsiteData;
		children: Snippet<[]>;
		isEditing?: boolean;
	} = $props();

	// svelte-ignore state_referenced_locally
	setAdditionalUserData(data.additionalData);
	// svelte-ignore state_referenced_locally
	setLoadedData(data.loaded ?? {});

	setCanEdit(
		() =>
			(dev && isEditing === true) ||
			(user.isLoggedIn && user.profile?.did === data.did && isEditing === true)
	);

	// svelte-ignore state_referenced_locally
	setDidContext(data.did as Did);
	// svelte-ignore state_referenced_locally
	setHandleContext(data.handle as Handle);
</script>

{@render children()}
