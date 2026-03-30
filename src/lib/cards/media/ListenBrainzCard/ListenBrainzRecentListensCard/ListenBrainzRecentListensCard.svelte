<script lang="ts">
	import type { ContentComponentProps } from '$lib/cards/types';
	import { recentListens } from './listens.remote';
	import { RelativeTime } from '@foxui/time';
	import CoverArt from '../CoverArt.svelte';

	const { item }: ContentComponentProps = $props();
	const listens = $derived(await recentListens(item.cardData.username));
</script>

<div class="z-10 flex h-full w-full flex-col gap-3 overflow-y-scroll p-4">
	{#each listens as listen, i (`${listen.listened_at}-${i}`)}
		<div class="flex w-full items-center gap-3">
			<CoverArt mbid={listen.track_metadata?.additional_info?.release_mbid} alt="cover art" />

			<div class="min-w-0 flex-1">
				<div class="inline-flex w-full max-w-full justify-between gap-2">
					<p class="min-w-0 flex-1 shrink truncate font-semibold">
						{listen.track_metadata.track_name}
					</p>

					<p class="shrink-0 text-xs">
						<RelativeTime date={new Date(listen.listened_at * 1000)} locale="en-US" /> ago
					</p>
				</div>

				<p class="my-1 min-w-0 truncate text-xs whitespace-nowrap">
					{listen.track_metadata.artist_name}
				</p>
			</div>
		</div>
	{:else}
		<p
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			No recent listens found.
		</p>
	{/each}
</div>
