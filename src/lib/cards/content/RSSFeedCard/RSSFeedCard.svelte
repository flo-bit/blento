<script lang="ts">
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getCanEdit } from '$lib/website/data/context';
	import type { ContentComponentProps } from '../../types';
	import DateTime from '../StandardSiteDocumentListCard/DateTime.svelte';
	import { fetchRssFeed } from './api.remote';
	import { normalizeFeedUrl } from './util';
	import type { RssFeedItem } from './types';

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	let feedUrl = $state<string | undefined>(undefined);
	let feed = $state<RssFeedItem[] | undefined>();
	const canEdit = getCanEdit();

	onMount(async () => {
		feedUrl = normalizeFeedUrl((item.cardData.href as string | undefined) ?? '') ?? '';
		// feedUrl === undefined => still initializing (show loading)
		if (feedUrl === '') return;

		const preloaded = (data[item.cardType] as Record<string, RssFeedItem[]> | undefined)?.[feedUrl];
		if (preloaded) {
			feed = preloaded;
			return;
		}

		try {
			feed = await fetchRssFeed(feedUrl);
			data[item.cardType] = {
				...((data[item.cardType] as Record<string, RssFeedItem[]> | undefined) ?? {}),
				[feedUrl]: feed
			};
		} catch {
			feed = [];
		}
	});
</script>

<div class="flex h-full flex-col gap-10 overflow-y-scroll p-8">
	{#if feedUrl === undefined}
		<div class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm">
			Loading RSS feed...
		</div>
	{:else if feedUrl === ''}
		<div class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm">
			{#if canEdit()}
				Add an RSS feed URL in Source settings.
			{:else}
				No RSS feed configured.
			{/if}
		</div>
	{:else}
		<div class={item.cardData?.label ? 'pt-4' : ''}>
			{#if item.cardData?.title}
				<div class="mb-4">
					<h3 class="text-lg font-semibold text-base-900 dark:text-base-50 truncate">{item.cardData.title}</h3>
				</div>
			{/if}

			{#if feed && feed.length > 0}
				{#each feed.slice(0, item.cardData?.itemCount ?? 5) as entry (entry.href)}
					<article class="group/article relative isolate flex flex-col">
						<div class="text-base-500 accent:text-accent-950 flex shrink-0 items-center gap-x-4 text-xs">
							{#if entry.date && !isNaN(new Date(entry.date).getTime())}
								<DateTime date={new Date(entry.date)} />
							{/if}
						</div>
						<div class="max-w-xl">
							<div class="text-base-900 dark:text-base-50 mt-3 text-lg leading-6 font-semibold">
								<a href={entry.href} target="_blank">
									<span class="absolute inset-0"></span>
									{entry.title}
								</a>

								<div class="bg-base-200/30 accent:bg-accent-200/20 dark:bg-base-800/30 absolute -inset-2 -z-10 scale-95 rounded-2xl opacity-0 transition-all duration-150 group-hover/article:scale-100 group-hover/article:opacity-100"></div>
							</div>
							{#if item.cardData?.showDescription !== false && entry.description}
								<p class="text-base-600 dark:text-base-400 accent:text-base-800 mt-5 text-sm leading-6">
									{entry.description}
								</p>
							{/if}
						</div>
					</article>
				{/each}
			{:else}
				<div class="z-50 flex h-full flex-col items-center justify-center gap-4 text-center text-sm">
					<span class="text-lg font-semibold">No RSS items found.</span>

					{#if canEdit()}
						<span>Check the feed URL in Source settings.</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>