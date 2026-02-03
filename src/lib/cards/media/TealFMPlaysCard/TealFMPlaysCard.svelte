<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { CardDefinitionsByType } from '../..';
	import AlbumArt from './AlbumArt.svelte';
	import { RelativeTime } from '@foxui/time';

	interface Artist {
		artistName: string;
	}

	interface PlayValue {
		releaseMbId?: string;
		trackName: string;
		playedTime?: string;
		artists?: Artist[];
		originUrl?: string;
	}

	interface Play {
		uri: string;
		value: PlayValue;
	}

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let feed = $state(data[item.cardType] as Play[] | undefined);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (feed) return;

		feed = (await CardDefinitionsByType[item.cardType]?.loadData?.([], {
			did,
			handle
		})) as Play[] | undefined;

		data[item.cardType] = feed;
	});

	function isNumeric(str: string) {
		if (typeof str != 'string') return false;
		return !isNaN(Number(str)) && !isNaN(parseFloat(str));
	}
</script>

{#snippet musicItem(play: Play)}
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
	{#if feed && feed.length > 0}
		{#each feed as play (play.uri)}
			{#if play.value.originUrl}
				<a href={play.value.originUrl} target="_blank" rel="noopener noreferrer" class="w-full">
					{@render musicItem(play)}
				</a>
			{:else}
				{@render musicItem(play)}
			{/if}
		{/each}
	{:else if feed}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			No recent plays found.
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			Loading plays...
		</div>
	{/if}
</div>
