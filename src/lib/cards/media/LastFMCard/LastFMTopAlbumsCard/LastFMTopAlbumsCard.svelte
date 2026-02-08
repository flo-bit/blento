<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContentComponentProps } from '../../../types';
	import { getAdditionalUserData } from '$lib/website/context';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import { fetchLastFM } from '../api.remote';

	interface Album {
		name: string;
		playcount: string;
		url: string;
		artist: { name: string; url: string };
		image: { '#text': string; size: string }[];
	}

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();

	let period = $derived(item.cardData.period ?? '7day');
	let layout: 'grid' | 'cinema' = $derived(item.cardData.layout ?? 'grid');
	const cacheKey = $derived(`lastfmTopAlbums:${item.cardData.lastfmUsername}:${period}`);

	// svelte-ignore state_referenced_locally
	let albums = $state(data[cacheKey] as Album[] | undefined);
	let loading = $state(false);
	let error = $state(false);

	async function fetchAlbums() {
		if (!item.cardData.lastfmUsername) return;
		loading = true;

		try {
			const result = await fetchLastFM({
				method: 'user.getTopAlbums',
				user: item.cardData.lastfmUsername,
				period
			});
			if (result) {
				albums = result?.topalbums?.album ?? [];
				data[cacheKey] = albums;
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
		if (!albums) fetchAlbums();
	});

	$effect(() => {
		const _period = period;
		const cached = data[cacheKey] as Album[] | undefined;
		if (cached) {
			albums = cached;
		} else {
			fetchAlbums();
		}
	});

	function getImageUrl(album: Album): string | null {
		if (!album.image || album.image.length === 0) return null;
		const preferred = ['extralarge', 'large', 'medium', 'small'];
		for (const pref of preferred) {
			const img = album.image.find((i) => i.size === pref);
			if (img?.['#text']) return img['#text'];
		}
		return album.image[album.image.length - 1]?.['#text'] || null;
	}

	let gridItems = $derived(
		(albums ?? []).map((album) => ({
			imageUrl: getImageUrl(album),
			link: album.url,
			label: `${album.name} - ${album.artist.name}`
		}))
	);
</script>

{#if error}
	<div class="flex h-full w-full items-center justify-center">
		<span class="text-base-500 dark:text-base-400 accent:text-white/60 text-sm">
			Failed to load albums.
		</span>
	</div>
{:else if albums && gridItems.length > 0}
	<ImageGrid items={gridItems} {layout} tooltip />
{:else if loading || !albums}
	<div class="flex h-full w-full items-center justify-center">
		<span class="text-base-500 dark:text-base-400 accent:text-white/60 text-sm">
			Loading albums...
		</span>
	</div>
{:else}
	<div class="flex h-full w-full items-center justify-center">
		<span class="text-base-500 dark:text-base-400 accent:text-white/60 text-sm">
			No top albums found.
		</span>
	</div>
{/if}
