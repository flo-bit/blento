<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import {
		getAdditionalUserData,
		getCanEdit,
		getDidContext,
		getHandleContext
	} from '$lib/website/context';
	import { CardDefinitionsByType } from '../..';
	import type { MarginEntry } from './index';
	import { Button } from '@foxui/core';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let entries = $state(data[item.cardType] as MarginEntry[] | undefined);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (!entries) {
			entries = (await CardDefinitionsByType[item.cardType]?.loadData?.([], {
				did,
				handle
			})) as MarginEntry[];

			data[item.cardType] = entries;
		}
	});

	let canEdit = getCanEdit();

	let filtered = $derived(
		entries?.filter((e) => {
			if (e.type === 'bookmark' && item.cardData.showBookmarks === false) return false;
			if (e.type === 'annotation' && item.cardData.showAnnotations === false) return false;
			if (e.type === 'highlight' && item.cardData.showHighlights === false) return false;
			return true;
		})
	);

	function getMarginUrl(entry: MarginEntry) {
		const rkey = entry.uri.split('/').pop();
		return `https://margin.at/${handle}/${entry.type}/${rkey}`;
	}

	function getDisplayUrl(url: string) {
		try {
			const u = new URL(url);
			return u.hostname + (u.pathname !== '/' ? u.pathname : '');
		} catch {
			return url;
		}
	}

	function truncate(text: string, max: number) {
		if (text.length <= max) return text;
		return text.slice(0, max) + '…';
	}
</script>

<div class={['flex h-full flex-col overflow-y-auto px-5 py-4', item.cardData.label ? 'pt-12' : '']}>
	{#if filtered && filtered.length > 0}
		<div class="flex flex-col gap-3">
			{#each filtered as entry (entry.uri)}
				{@const source =
					entry.type === 'bookmark' ? entry.value.source : entry.value.target?.source}
				<a
					href={getMarginUrl(entry)}
					target="_blank"
					rel="noopener noreferrer"
					class="bg-base-100 dark:bg-base-800 accent:bg-black/10 hover:bg-base-200 dark:hover:bg-base-700 accent:hover:bg-black/15 flex flex-col gap-1.5 rounded-xl px-5 py-3 transition-colors"
				>
					<div class="flex items-center gap-2 pb-1">
						{#if entry.type === 'bookmark'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="text-accent-500 accent:text-black size-3.5 shrink-0"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
								/>
							</svg>
						{:else if entry.type === 'annotation'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="text-accent-500 accent:text-black size-3.5 shrink-0"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
								/>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-accent-500 accent:text-black size-3.5 shrink-0"
							>
								<path d="m9 11-6 6v3h9l3-3" />
								<path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
							</svg>
						{/if}
						<span class="text-base-500 dark:text-base-400 accent:text-black/80 text-xs capitalize"
							>{entry.type}</span
						>
						<span class="text-base-400 dark:text-base-500 accent:text-black/60 ml-auto text-xs">
							{new Date(entry.createdAt).toLocaleDateString()}
						</span>
					</div>

					{#if entry.type === 'bookmark' && entry.value.title}
						<span
							class="text-base-900 dark:text-base-100 accent:text-black text-sm leading-snug font-medium"
						>
							{truncate(entry.value.title as string, 80)}
						</span>
					{/if}

					{#if entry.type === 'annotation' && entry.value.body?.value}
						<span class="text-base-900 dark:text-base-100 accent:text-black text-sm leading-snug font-medium">
							{truncate(entry.value.body.value as string, 120)}
						</span>
					{/if}

					{#if entry.type === 'highlight' && entry.value.target?.selector}
						{@const selectors = Array.isArray(entry.value.target.selector)
							? entry.value.target.selector
							: [entry.value.target.selector]}
						{@const quote = selectors.find((s: any) => s.exact)?.exact}
						{#if quote}
							<span
								class="text-base-700 dark:text-base-300 accent:text-black/80 border-accent-500 accent:border-black/60 border-l-2 pl-3 text-sm leading-snug italic"
							>
								{truncate(quote as string, 120)}
							</span>
						{/if}
					{/if}

					{#if source}
						<span class="text-base-400 dark:text-base-500 accent:text-black/60 truncate text-xs">
							{getDisplayUrl(source as string)}
						</span>
					{/if}
				</a>
			{/each}
		</div>
	{:else if filtered}
		<div class="flex h-full w-full flex-col items-center justify-center gap-4 text-center text-sm">
			No margin entries yet.
			{#if canEdit()}
				<Button href="https://margin.at" target="_blank" rel="noopener noreferrer">
					Try Margin
				</Button>
			{/if}
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-black/60 flex h-full w-full items-center justify-center text-center text-sm"
		>
			Loading...
		</div>
	{/if}
</div>
