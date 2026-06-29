<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/data/context';
	import { CardDefinitionsByType } from '../..';
	import { RelativeTime } from '@foxui/time';
	import { scoreMeta, scoreSubtitle, scoreTitle, type EnrichedDerakkumaScore } from './shared';

	let { item }: { item: Item } = $props();
	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let feed = $state(data[item.cardType] as EnrichedDerakkumaScore[] | undefined);
	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (feed) return;
		feed = (await CardDefinitionsByType[item.cardType]?.loadData?.([], { did, handle })) as
			| EnrichedDerakkumaScore[]
			| undefined;
		data[item.cardType] = feed;
	});

	function dateFor(score: EnrichedDerakkumaScore): Date | undefined {
		const value =
			score.value.playedAt ?? score.value.lastPlayed ?? score.value.updatedAt ?? score.value.createdAt;
		if (!value) return;
		return new Date(value);
	}
</script>

{#snippet fallbackArt()}
	<div
		class="bg-base-200 dark:bg-base-800 accent:bg-accent-700/40 flex size-11 items-center justify-center rounded-lg text-sm"
	>
		♪
	</div>
{/snippet}

<div class="z-10 flex h-full w-full flex-col gap-3 overflow-y-scroll p-4">
	{#if feed && feed.length > 0}
		{#each feed as score (score.uri)}
			<div class="flex w-full items-center gap-3">
				<div class="size-11 shrink-0">
					{#if score.coverArtUrl}
						<img src={score.coverArtUrl} alt="" class="size-11 rounded-lg object-cover" />
					{:else}
						{@render fallbackArt()}
					{/if}
				</div>
				<div class="min-w-0 flex-1">
					<div class="inline-flex w-full max-w-full justify-between gap-2">
						<div
							class="text-accent-500 accent:text-accent-950 min-w-0 flex-1 truncate font-semibold"
						>
							{scoreTitle(score)}
						</div>
						{#if dateFor(score)}
							<div class="shrink-0 text-xs">
								<RelativeTime date={dateFor(score)!} locale="en-US" /> ago
							</div>
						{/if}
					</div>
					<div class="truncate text-xs font-medium">{scoreSubtitle(score)}</div>
					<div class="text-base-500 dark:text-base-400 accent:text-accent-950/70 truncate text-xs">
						{scoreMeta(score)}
					</div>
				</div>
			</div>
		{/each}
	{:else if feed}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			No Derakkuma records found.
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			Loading Derakkuma records...
		</div>
	{/if}
</div>
