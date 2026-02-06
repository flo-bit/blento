<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { CardDefinitionsByType } from '../..';
	import { RelativeTime } from '@foxui/time';

	interface NpmxLike {
		uri: string;
		value: {
			subjectRef: string;
			createdAt: string;
		};
	}

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let feed = $state(data[item.cardType] as NpmxLike[] | undefined);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (feed) return;

		feed = (await CardDefinitionsByType[item.cardType]?.loadData?.([], {
			did,
			handle
		})) as NpmxLike[] | undefined;

		data[item.cardType] = feed;
	});

	function getPackageName(like: NpmxLike): string {
		return like.value.subjectRef.split('/package/')[1] ?? like.value.subjectRef;
	}
</script>

{#snippet likeItem(like: NpmxLike)}
	<div class="flex w-full items-center gap-3">
		<div
			class="text-accent-500 accent:text-accent-950 flex size-8 shrink-0 items-center justify-center"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
				/>
			</svg>
		</div>
		<div class="min-w-0 flex-1">
			<div class="inline-flex w-full max-w-full items-baseline justify-between gap-2">
				<div
					class="text-accent-500 accent:text-accent-950 min-w-0 flex-1 shrink truncate text-sm font-semibold"
				>
					{getPackageName(like)}
				</div>
				{#if like.value.createdAt}
					<div class="text-base-500 dark:text-base-400 accent:text-white/60 shrink-0 text-xs">
						<RelativeTime date={new Date(like.value.createdAt)} locale="en-US" /> ago
					</div>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

<div class="z-10 flex h-full w-full flex-col gap-3 overflow-y-scroll p-4">
	{#if feed && feed.length > 0}
		{#each feed as like (like.uri)}
			<a
				href="https://npmx.dev/package/{getPackageName(like)}"
				target="_blank"
				rel="noopener noreferrer"
				class="w-full"
			>
				{@render likeItem(like)}
			</a>
		{/each}
	{:else if feed}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			No liked packages found.
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			Loading likes...
		</div>
	{/if}
</div>
