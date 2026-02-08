<script lang="ts">
	import { onMount } from 'svelte';
	import { getAdditionalUserData } from '$lib/website/context';
	import type { ContentComponentProps } from '../../../types';
	import LastFMAlbumArt from '../LastFMAlbumArt.svelte';
	import { RelativeTime } from '@foxui/time';
	import { fetchLastFM } from '../api.remote';

	interface Track {
		name: string;
		artist: { '#text': string };
		album: { '#text': string };
		image: { '#text': string; size: string }[];
		url: string;
		date?: { uts: string };
		'@attr'?: { nowplaying: string };
	}

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	const cacheKey = $derived(`lastfmRecentTracks:${item.cardData.lastfmUsername}`);

	// svelte-ignore state_referenced_locally
	let tracks = $state(data[cacheKey] as Track[] | undefined);
	let error = $state(false);

	onMount(async () => {
		if (tracks) return;
		if (!item.cardData.lastfmUsername) return;

		try {
			const result = await fetchLastFM({
				method: 'user.getRecentTracks',
				user: item.cardData.lastfmUsername
			});
			if (result) {
				tracks = result?.recenttracks?.track ?? [];
				data[cacheKey] = tracks;
			} else {
				error = true;
			}
		} catch {
			error = true;
		}
	});
</script>

<div class="z-10 flex h-full w-full flex-col gap-3 overflow-y-scroll p-4">
	{#if tracks && tracks.length > 0}
		{#each tracks as track, i (track.url + i)}
			<a
				href={track.url}
				target="_blank"
				rel="noopener noreferrer"
				class="flex w-full items-center gap-3"
			>
				<div class="size-10 shrink-0">
					<LastFMAlbumArt images={track.image} alt={track.album?.['#text']} />
				</div>
				<div class="min-w-0 flex-1">
					<div class="inline-flex w-full max-w-full justify-between gap-2">
						<div
							class="text-accent-500 accent:text-accent-950 min-w-0 flex-1 shrink truncate font-semibold"
						>
							{track.name}
						</div>
						{#if track['@attr']?.nowplaying === 'true'}
							<div class="flex shrink-0 items-center gap-1 text-xs text-green-500">
								<span class="inline-block size-2 animate-pulse rounded-full bg-green-500"></span>
								Now
							</div>
						{:else if track.date?.uts}
							<div class="shrink-0 text-xs">
								<RelativeTime date={new Date(parseInt(track.date.uts) * 1000)} locale="en-US" /> ago
							</div>
						{/if}
					</div>
					<div class="my-1 min-w-0 truncate text-xs whitespace-nowrap">
						{track.artist?.['#text']}
					</div>
				</div>
			</a>
		{/each}
	{:else if error}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			Failed to load tracks.
		</div>
	{:else if tracks}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			No recent tracks found.
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			Loading tracks...
		</div>
	{/if}
</div>
