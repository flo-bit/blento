<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { CardDefinitionsByType } from '..';
	import AlbumArt from './AlbumArt.svelte';
	import { RelativeTime } from '@foxui/time';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let feed = $state(data[item.cardType] as any);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		console.log(feed);
		if (!feed) {
			feed = (await CardDefinitionsByType[item.cardType]?.loadData?.([], {
				did,
				handle
			})) as any;

			console.log(feed);

			data[item.cardType] = feed;
		}
	});

	function isNumeric(str: string) {
		if (typeof str != 'string') return false; // we only process strings!
		return (
			!isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
			!isNaN(parseFloat(str))
		); // ...and ensure strings of whitespace fail
	}
</script>

{#snippet musicItem(play)}
	<div class="flex w-full items-center gap-3">
		<div class="size-10 shrink-0">
			<AlbumArt releaseMbId={play.value.releaseMbId} alt="" />
		</div>
		<div class="min-w-0 flex-1">
			<div class="inline-flex w-full max-w-full justify-between gap-2">
				<div
					class="text-accent-500 accent:text-accent-950 min-w-0 flex-1 shrink truncate font-semibold"
				>
					{play.value.trackName}
				</div>

				{#if play.value.playedTime}
					<div class="shrink-0 text-xs">
						<RelativeTime
							date={new Date(
								isNumeric(play.value.playedTime)
									? parseInt(play.value.playedTime) * 1000
									: play.value.playedTime
							)}
							locale="en-US"
						/> ago
					</div>
				{:else}
					<div></div>
				{/if}
			</div>
			<div class="my-1 min-w-0 gap-2 truncate text-xs whitespace-nowrap">
				{(play?.value?.artists ?? []).map((a) => a.artistName).join(', ')}
			</div>
		</div>
	</div>
{/snippet}

<div class="z-10 flex h-full w-full flex-col gap-4 overflow-y-scroll p-4">
	{#each (feed ?? []).slice(0, 20) as play}
		{#if play.value.originUrl}
			<a href={play.value.originUrl} target="_blank" rel="noopener noreferrer" class="w-full">
				{@render musicItem(play)}
			</a>
		{:else}
			{@render musicItem(play)}
		{/if}
	{/each}
</div>
