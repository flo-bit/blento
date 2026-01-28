<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { BlueskyPost } from '../../components/bluesky-post';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { CardDefinitionsByType } from '..';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let feed = $state((data[item.cardType] as any)?.feed);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (!feed) {
			feed = (
				(await CardDefinitionsByType[item.cardType]?.loadData?.([], {
					did,
					handle
				})) as any
			).feed;

			console.log(feed);

			data[item.cardType] = feed;
		}
	});
</script>

<div class="flex h-full flex-col justify-center-safe overflow-y-scroll p-4">
	<div
		class="accent:text-base-950 bg-base-200/50 dark:bg-base-700/30 mx-auto mb-6 w-fit rounded-xl p-1 px-2 text-2xl font-semibold"
	>
		My latest bluesky post
	</div>
	{#if feed?.[0]?.post}
		<BlueskyPost showLogo feedViewPost={feed?.[0].post}></BlueskyPost>
		<div class="h-4 w-full"></div>
	{:else}
		Your latest bluesky post will appear here.
	{/if}
</div>
