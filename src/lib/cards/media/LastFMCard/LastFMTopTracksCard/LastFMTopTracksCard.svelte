<script lang="ts">
	import { onMount } from 'svelte';
	import { getAdditionalUserData } from '$lib/website/context';
	import type { ContentComponentProps } from '../../../types';
	import LastFMAlbumArt from '../LastFMAlbumArt.svelte';
	import { fetchLastFM } from '../api.remote';

	interface Track {
		name: string;
		playcount: string;
		artist: { name: string; url: string };
		image: { '#text': string; size: string }[];
		url: string;
	}

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();

	let period = $derived(item.cardData.period ?? '7day');
	const cacheKey = $derived(`lastfmTopTracks:${item.cardData.lastfmUsername}:${period}`);

	// svelte-ignore state_referenced_locally
	let tracks = $state(data[cacheKey] as Track[] | undefined);
	let error = $state(false);
	let loading = $state(false);

	async function fetchTracks() {
		if (!item.cardData.lastfmUsername) return;
		loading = true;

		try {
			const result = await fetchLastFM({
				method: 'user.getTopTracks',
				user: item.cardData.lastfmUsername,
				period
			});
			if (result) {
				tracks = result?.toptracks?.track ?? [];
				data[cacheKey] = tracks;
			} else {
				error = true;
			}
		} catch {
			error = true;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (!tracks) fetchTracks();
	});

	$effect(() => {
		const _period = period;
		const cached = data[cacheKey] as Track[] | undefined;
		if (cached) {
			tracks = cached;
		} else {
			fetchTracks();
		}
	});
</script>

<div class="z-10 flex h-full w-full flex-col gap-3 overflow-y-scroll p-4">
	{#if tracks && tracks.length > 0}
		{#each tracks as track, i (track.url)}
			<a
				href={track.url}
				target="_blank"
				rel="noopener noreferrer"
				class="flex w-full items-center gap-3"
			>
				<div
					class="text-base-400 dark:text-base-500 accent:text-white/40 w-5 shrink-0 text-right text-xs font-bold"
				>
					{i + 1}
				</div>
				<div class="size-10 shrink-0">
					<LastFMAlbumArt images={track.image} alt={track.name} />
				</div>
				<div class="min-w-0 flex-1">
					<div class="inline-flex w-full max-w-full justify-between gap-2">
						<div
							class="text-accent-500 accent:text-accent-950 min-w-0 flex-1 shrink truncate font-semibold"
						>
							{track.name}
						</div>
						<div class="shrink-0 text-xs">
							{parseInt(track.playcount).toLocaleString()} plays
						</div>
					</div>
					<div class="my-1 min-w-0 truncate text-xs whitespace-nowrap">
						{track.artist?.name}
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
	{:else if tracks || loading}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			{tracks?.length === 0 ? 'No top tracks found.' : 'Loading tracks...'}
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			Loading tracks...
		</div>
	{/if}
</div>
