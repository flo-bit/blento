<script lang="ts">
	import type { ContentComponentProps } from '$lib/cards/types';
	import { topArtists } from './artists.remote';

	const { item }: ContentComponentProps = $props();
	const artists = $derived(await topArtists(item.cardData.username));
</script>

<div class="z-10 flex h-full w-full flex-col gap-3 overflow-y-scroll p-4">
	{#each artists as artist, i (artist.artist_mbid || artist.artist_name + i)}
		<div class="flex w-full items-center gap-3">
			<div class="text-base-400 flex w-6 shrink-0 items-center justify-center text-xs font-bold">
				{i + 1}
			</div>
			<div class="min-w-0 flex-1">
				<div class="truncate font-semibold">{artist.artist_name}</div>
				<div class="text-base-500 text-xs">{artist.listen_count} listens</div>
			</div>
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			No top artists found.
		</div>
	{/each}
</div>
