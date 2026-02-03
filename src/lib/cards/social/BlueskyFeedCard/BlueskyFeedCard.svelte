<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { BlueskyPost } from '$lib/components/bluesky-post';
	import { getAdditionalUserData, getDidContext } from '$lib/website/context';
	import { resolveHandle, getAuthorFeed } from '$lib/atproto/methods';
	import type { Did, Handle } from '@atcute/lexicons';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	const did = getDidContext();

	// svelte-ignore state_referenced_locally
	const lookupKey = (item.cardData.did as string) || (item.cardData.handle as string) || did;
	// svelte-ignore state_referenced_locally
	const preloaded = (data[item.cardType] as Record<string, any>)?.[lookupKey];
	let feed: any[] | undefined = $state(preloaded?.feed);
	let cursor = $state<string | undefined>(preloaded?.cursor);
	// svelte-ignore state_referenced_locally
	let targetDid = $state<Did | undefined>(item.cardData.did ? (item.cardData.did as Did) : did);
	let loading = $state(false);

	async function loadMore() {
		if (loading || !cursor || !targetDid) return;
		loading = true;
		try {
			const result = await getAuthorFeed({
				did: targetDid,
				filter: 'posts_no_replies',
				limit: 20,
				cursor
			});
			if (result?.feed) {
				feed = [...(feed ?? []), ...result.feed];
			}
			cursor = result?.cursor;
		} finally {
			loading = false;
		}
	}

	function handleScroll(e: Event) {
		const el = e.currentTarget as HTMLElement;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
			loadMore();
		}
	}

	onMount(async () => {
		if (feed) return;

		// Resolve handle to DID if needed
		if (item.cardData.handle && !item.cardData.did) {
			try {
				targetDid = await resolveHandle({ handle: item.cardData.handle as Handle });
			} catch {
				// fall back to context did
			}
		}

		try {
			const result = await getAuthorFeed({
				did: targetDid,
				filter: 'posts_no_replies',
				limit: 20
			});
			feed = result?.feed;
			cursor = result?.cursor;
		} catch {
			// failed to fetch feed
		}
	});
</script>

<div class="flex h-full flex-col overflow-x-hidden overflow-y-auto p-3" onscroll={handleScroll}>
	{#if feed && feed.length > 0}
		<div class={[item.cardData.label ? 'pt-8' : '']}>
			{#each feed as feedItem, i (feedItem.post?.uri ?? i)}
				<BlueskyPost showAvatar compact feedViewPost={feedItem.post} />
				{#if i < feed.length - 1}
					<div
						class="border-base-200 dark:border-base-800 accent:border-base-50/5 my-3 border-t"
					></div>
				{/if}
			{/each}
		</div>
		{#if loading}
			<div class="text-base-400 py-2 text-center text-xs">Loading...</div>
		{/if}
	{:else}
		<div class="text-base-500 flex h-full items-center justify-center text-sm">
			No posts to show
		</div>
	{/if}
</div>
