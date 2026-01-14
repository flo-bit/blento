<script lang="ts">
	import { getAdditionalUserData } from '$lib/helper';
	import { onMount } from 'svelte';
	import type { ContentComponentProps } from '../types';
	import { CardDefinitionsByType } from '..';
	import { getDidContext, getHandleContext } from '$lib/website/context';
	import { Badge, Button } from '@foxui/core';

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let collections = $state(data[item.cardType] as string[]);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (!collections) {
			collections = (await CardDefinitionsByType[item.cardType]?.loadData?.([], {
				did,
				handle
			})) as string[];

			data[item.cardType] = collections;
		}
	});

	function getLink(collection: string) {
		const split = collection.split('.');
		return `https://pdsls.dev/at://${did}#collections:${split[1]}.${split[0]}`;
	}
</script>

<div class="h-full overflow-y-scroll py-4">
	<div class="mb-4 inline-flex w-full items-center justify-between font-semibold px-4">
		<span>My AT Protocol Collections</span>

		{#if collections}
			<Badge size="md" class="accent:text-accent-950">{collections.length}</Badge>
		{/if}
	</div>
	<div class="flex flex-wrap overflow-y-scroll gap-2 px-4 overflow-x-hidden w-full">
		{#each collections ?? [] as collection}
			<Button target="_blank" href={getLink(collection)} size="sm">{collection}</Button>
		{/each}
	</div>
</div>
