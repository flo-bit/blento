<script lang="ts">
	import type { ContentComponentProps } from '$lib/cards/types';
	import { nowPlaying } from './nowplaying.remote';
	import type { Listen } from '../types.ts';

	const { item }: ContentComponentProps = $props();
	const playing = $derived(await nowPlaying(item.cardData.username));

	function getCoverArtUrl(listen: Listen): string | undefined {
		const releaseMbid = listen.track_metadata?.additional_info?.release_mbid;
		return releaseMbid ? `https://coverartarchive.org/release/${releaseMbid}/front-500` : undefined;
	}
</script>

{#if playing}
	{@const coverArtUrl = getCoverArtUrl(playing)}

	{#if coverArtUrl}
		<div class="now-playing-bg relative flex h-full w-full items-end">
			<img class="absolute inset-0 -z-10 size-full object-cover" src={coverArtUrl} alt="" />
			<div
				class="absolute inset-0 -z-10 bg-linear-to-t from-black/80 via-black/40 to-transparent to-50%"
			></div>
			<div class="now-playing-content z-10 flex w-full items-end p-4">
				<div class="now-playing-info min-w-0 flex-1">
					<div class="text-xs text-white/70">Now Playing</div>
					<div class="min-w-0 truncate text-lg font-semibold text-white">
						{playing.track_metadata.track_name}
					</div>
					<div class="min-w-0 truncate text-sm text-white/80">
						{playing.track_metadata.artist_name}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="z-10 flex h-full w-full items-center justify-center p-4">
			<div class="flex w-full items-center gap-4">
				<div class="bg-base-200 flex size-14 shrink-0 items-center justify-center rounded-lg">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="size-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z"
						/>
					</svg>
				</div>
				<div class="min-w-0 flex-1">
					<div class="text-base-500 dark:text-base-400 text-xs">Now Playing</div>
					<div
						class="text-accent-500 accent:text-accent-950 min-w-0 truncate text-lg font-semibold"
					>
						{playing.track_metadata.track_name}
					</div>
					<div class="min-w-0 truncate text-sm whitespace-nowrap">
						{playing.track_metadata.artist_name}
					</div>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<div
		class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
	>
		Not currently playing.
	</div>
{/if}

<style>
	:global(:root),
	:global(*) {
		--dw: 4;
	}

	@media (min-width: 1024px) {
		.now-playing-bg {
			--dw: var(--dw, 4);
		}

		.now-playing-info {
			display: none;
		}

		@container card (width >= 4rem) {
			.now-playing-info {
				display: block;
			}
		}
	}
</style>
