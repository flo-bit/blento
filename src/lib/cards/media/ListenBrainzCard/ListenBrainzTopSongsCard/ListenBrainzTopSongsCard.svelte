<script lang="ts">
	import { fetchListenBrainzTopSongs } from './recordings.remote';
	import type { ContentComponentProps } from '$lib/cards/types';
	import CoverArt from '../CoverArt.svelte';

	const { item }: ContentComponentProps = $props();
	const recordings = $derived(await fetchListenBrainzTopSongs(item.cardData.username));
</script>

<div class="z-10 flex h-full w-full flex-col gap-3 overflow-y-scroll p-4">
	{#each recordings as recording, i (recording.recording_mbid || recording.track_name + i)}
		<div class="flex w-full items-center gap-3">
			<div class="text-base-400 flex w-6 shrink-0 items-center justify-center text-xs font-bold">
				{i + 1}
			</div>
			<CoverArt mbid={recording.caa_release_mbid} alt="cover art" />
			<div class="min-w-0 flex-1">
				<div class="truncate font-semibold">{recording.track_name}</div>
				<div class="text-base-500 truncate text-xs">
					{recording.artist_name} · {recording.listen_count} plays
				</div>
			</div>
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			No top songs found.
		</div>
	{/each}
</div>
