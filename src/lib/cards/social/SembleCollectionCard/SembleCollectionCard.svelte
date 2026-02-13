<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { CardDefinitionsByType } from '../..';
	import type { SembleCollectionData } from './index';

	let { item }: { item: Item } = $props();

	const additionalData = getAdditionalUserData();
	let did = getDidContext();
	let handle = getHandleContext();

	let key = $derived(`${item.cardData.handle}/${item.cardData.collectionRkey}`);

	// svelte-ignore state_referenced_locally
	let collectionData = $state(
		additionalData[item.cardType] != null
			? (additionalData[item.cardType] as Record<string, SembleCollectionData>)[key]
			: undefined
	);

	onMount(async () => {
		if (!collectionData) {
			const result = (await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did,
				handle
			})) as Record<string, SembleCollectionData>;

			if (result) {
				additionalData[item.cardType] = {
					...((additionalData[item.cardType] as Record<string, SembleCollectionData>) ?? {}),
					...result
				};
				collectionData = result[key];
			}
		}
	});

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
	{#if collectionData}
		<div class="mb-3 flex flex-col gap-1">
			<h3 class="text-base-900 dark:text-base-100 accent:text-black text-sm font-semibold">
				{collectionData.name}
			</h3>
			{#if collectionData.description}
				<p class="text-base-500 dark:text-base-400 accent:text-black/60 text-xs">
					{collectionData.description}
				</p>
			{/if}
		</div>

		{#if collectionData.cards.length > 0}
			<div class="flex flex-col gap-3">
				{#each collectionData.cards as card (card.uri)}
					{#if card.type === 'URL' && card.url}
						<a
							href={card.url}
							target="_blank"
							rel="noopener noreferrer"
							class="bg-base-100 dark:bg-base-800 accent:bg-black/10 hover:bg-base-200 dark:hover:bg-base-700 accent:hover:bg-black/15 flex flex-col gap-1.5 rounded-xl px-5 py-3 transition-colors"
						>
							{#if card.title}
								<span
									class="text-base-900 dark:text-base-100 accent:text-black text-sm leading-snug font-medium"
								>
									{truncate(card.title, 80)}
								</span>
							{/if}
							{#if card.description}
								<span
									class="text-base-600 dark:text-base-400 accent:text-black/70 text-xs leading-snug"
								>
									{truncate(card.description, 120)}
								</span>
							{/if}
							<span class="text-base-400 dark:text-base-500 accent:text-black/60 truncate text-xs">
								{getDisplayUrl(card.url)}
							</span>
						</a>
					{:else if card.type === 'NOTE' && card.text}
						<div
							class="bg-base-100 dark:bg-base-800 accent:bg-black/10 flex flex-col gap-1.5 rounded-xl px-5 py-3"
						>
							<span
								class="text-base-700 dark:text-base-300 accent:text-black/80 border-accent-500 accent:border-black/60 border-l-2 pl-3 text-sm leading-snug italic"
							>
								{truncate(card.text, 200)}
							</span>
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<div
				class="text-base-500 dark:text-base-400 accent:text-black/60 flex flex-1 items-center justify-center text-center text-sm"
			>
				No cards in this collection yet.
			</div>
		{/if}
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-black/60 flex h-full w-full items-center justify-center text-center text-sm"
		>
			Loading...
		</div>
	{/if}
</div>
