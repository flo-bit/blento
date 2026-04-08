<script lang="ts">
	import type { ContentComponentProps } from '$lib/cards/types';
	import { topAlbums } from './albums.remote';
	import CoverArt from '../CoverArt.svelte';

	const { item }: ContentComponentProps = $props();
	const albums = $derived(await topAlbums(item.cardData.username));
</script>

<div class="z-10 flex h-full w-full flex-col gap-3 overflow-y-scroll p-4">
	{#each albums as album, i (album.release_group_mbid || album.release_group_name + i)}
		<div class="flex w-full items-center gap-3">
			<div class="text-base-400 flex w-6 shrink-0 items-center justify-center text-xs font-bold">
				{i + 1}
			</div>
			<CoverArt mbid={album.caa_release_mbid} alt="cover art" />
			<div class="min-w-0 flex-1">
				<div class="truncate font-semibold">{album.release_group_name}</div>
				<div class="text-base-500 text-xs">
					{album.artist_name} · {album.listen_count} listens
				</div>
			</div>
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			No top albums found.
		</div>
	{/each}
</div>
