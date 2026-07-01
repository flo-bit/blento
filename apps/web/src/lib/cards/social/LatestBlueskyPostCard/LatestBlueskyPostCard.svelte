<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { BlueskyPost } from '$lib/components/bluesky-post';
	import {
		getAdditionalUserData,
		getLoadedData,
		getDidContext,
		getHandleContext
	} from '$lib/website/data/context';
	import { CardDefinitionsByType } from '../..';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	const loaded = getLoadedData();
	// Prefer this node's resolved source data (loaded[nodeId] via @blento/sources); fall back to the
	// legacy cardType-keyed additionalData for entry points that don't resolve the node graph.
	// svelte-ignore state_referenced_locally
	let feed = $state((loaded?.[item.id]?.data as any)?.feed ?? (data[item.cardType] as any)?.feed);

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

			data[item.cardType] = feed;
		}
	});
</script>

<div class="flex h-full flex-col justify-center-safe overflow-y-scroll p-4">
	{#if feed?.[0]?.post}
		<div class={[item.cardData.label ? 'pt-8' : '']}>
			<BlueskyPost showLogo feedViewPost={feed?.[0].post}></BlueskyPost>
		</div>
		<div class="h-4 w-full"></div>
	{:else}
		Your latest bluesky post will appear here.
	{/if}
</div>
