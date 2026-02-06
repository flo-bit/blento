<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { NpmxLikesLeaderboardCardDefinition } from '.';

	interface LeaderboardEntry {
		subjectRef: string;
		totalLikes: number;
	}

	interface LeaderboardData {
		totalLikes: number;
		totalUniqueLikers: number;
		leaderBoard: LeaderboardEntry[];
	}

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let leaderboard = $state(data[item.cardType] as LeaderboardData | undefined);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (leaderboard) return;

		leaderboard = (await NpmxLikesLeaderboardCardDefinition.loadData?.([], {
			did,
			handle
		})) as LeaderboardData | undefined;

		data[item.cardType] = leaderboard;
	});

	function getPackageName(entry: LeaderboardEntry): string {
		return entry.subjectRef.split('/package/')[1] ?? entry.subjectRef;
	}
</script>

{#snippet leaderboardRow(entry: LeaderboardEntry, index: number)}
	<div
		class="hover:bg-base-100 dark:hover:bg-base-800 accent:hover:bg-white/10 flex w-full items-center gap-3 rounded-lg px-2 py-1.5 transition-colors"
	>
		<div
			class="text-base-600 dark:text-base-400 accent:text-white/60 w-6 shrink-0 text-right text-xs font-medium"
		>
			#{index + 1}
		</div>
		<div class="min-w-0 flex-1">
			<div class="inline-flex w-full max-w-full items-center justify-between gap-2">
				<div
					class="text-accent-500 accent:text-accent-50 dark:text-accent-400 min-w-0 flex-1 shrink truncate text-sm font-semibold"
				>
					{getPackageName(entry)}
				</div>
				<div
					class="text-base-500 dark:text-base-400 accent:text-white/60 flex shrink-0 items-center gap-1 text-xs"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="accent:text-accent-200 text-accent-400 size-3.5"
					>
						<path
							d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"
						/>
					</svg>
					{entry.totalLikes}
				</div>
			</div>
		</div>
	</div>
{/snippet}

<div class="z-10 flex h-full w-full flex-col overflow-hidden">
	{#if leaderboard && leaderboard.leaderBoard.length > 0}
		<div class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4 pb-10">
			{#each leaderboard.leaderBoard as entry, index (entry.subjectRef)}
				<a
					href="https://npmx.dev/package/{getPackageName(entry)}"
					target="_blank"
					rel="noopener noreferrer"
					class="w-full"
				>
					{@render leaderboardRow(entry, index)}
				</a>
			{/each}
		</div>
		<div
			class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-linear-to-t from-base-200 from-40% to-transparent dark:from-base-950 accent:from-accent-500"
		></div>
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 bg-base-200 dark:bg-base-950/50 accent:bg-accent-500/20 relative z-10 flex shrink-0 items-center justify-center gap-3 px-4 pb-3 text-xs"
		>
			<span>{leaderboard.totalLikes} likes</span>
			<span class="text-base-300 dark:text-base-600 accent:text-white/20">&middot;</span>
			<span>{leaderboard.totalUniqueLikers} unique likers</span>
		</div>
	{:else if leaderboard}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center p-4 text-center text-sm"
		>
			No leaderboard data.
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center p-4 text-center text-sm"
		>
			Loading leaderboard...
		</div>
	{/if}
</div>
