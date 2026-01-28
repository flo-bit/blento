<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { BlueskyPost } from '../../components/bluesky-post';
	import { getAdditionalUserData } from '$lib/website/context';
	import { getPosts, resolveHandle } from '$lib/atproto/methods';
	import type { PostView } from '@atcute/bluesky/types/app/feed/defs';
	import type { Handle } from '@atcute/lexicons';
	import { isDid } from '@atcute/lexicons/syntax';
	import { resolveUri } from './utils';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	let uri = $derived(item.cardData.uri as string);

	// svelte-ignore state_referenced_locally
	let post = $state((data['blueskyPost'] as Record<string, PostView>)?.[uri]);

	onMount(async () => {
		if (!post && uri) {
			// Resolve handle to DID if needed
			const resolvedUri = await resolveUri(uri);

			const posts = await getPosts({ uris: [resolvedUri] });
			if (posts && posts.length > 0) {
				post = posts[0];
				// Store in data for future use (keyed by resolved URI)
				if (!data['blueskyPost']) {
					data['blueskyPost'] = {};
				}
				(data['blueskyPost'] as Record<string, PostView>)[resolvedUri] = post;
				// Also store under original URI for lookup
				(data['blueskyPost'] as Record<string, PostView>)[uri] = post;
			}
		}
	});
</script>

<div class="flex h-full flex-col justify-center-safe overflow-y-scroll p-4">
	{#if post}
		<BlueskyPost showLogo feedViewPost={post}></BlueskyPost>
		<div class="h-4 w-full"></div>
	{:else}
		<p class="text-base-600 dark:text-base-400 text-center">A bluesky post will appear here</p>
	{/if}
</div>
