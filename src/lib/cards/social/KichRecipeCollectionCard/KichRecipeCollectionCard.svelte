<script lang="ts">
	import { onMount } from 'svelte';
	import { parseUri } from '$lib/atproto';
	import type { Did } from '@atcute/lexicons';
	import { CardDefinitionsByType } from '../..';
	import { getAdditionalUserData } from '$lib/website/context';
	import type { ContentComponentProps } from '../../types';
	import KichMascot from '../KichRecipeCard/KichMascot.svelte';
	import type { KichRecipeCollectionCardData } from '.';

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	let parsedUri = $derived(item.cardData?.uri ? parseUri(item.cardData.uri) : null);

	let fetchedCollection = $state<KichRecipeCollectionCardData | undefined>(undefined);
	let isLoaded = $state(false);

	let cardData = $derived(
		fetchedCollection ||
			((data[item.cardType] as Record<string, KichRecipeCollectionCardData> | undefined)?.[
				item.id
			] as KichRecipeCollectionCardData | undefined)
	);

	let collection = $derived(cardData?.collection);
	let title = $derived(collection?.name || 'Recipe Collection');
	let description = $derived(collection?.description || '');

	let collectionUrl = $derived.by(() => {
		if (item.cardData?.href && typeof item.cardData.href === 'string') {
			return item.cardData.href as string;
		}
		if (!parsedUri?.rkey) return 'https://kich.io';
		const handle = (item.cardData?.kichHandle as string | undefined) || parsedUri.repo;
		return `https://kich.io/profile/${handle}/collection/${parsedUri.rkey}`;
	});

	let imageUrl = $derived.by(() => {
		if (!parsedUri?.repo || !collection?.image?.ref?.$link) return undefined;
		return `https://cdn.bsky.app/img/feed_thumbnail/plain/${parsedUri.repo}/${collection.image.ref.$link}@jpeg`;
	});

	let metaItems = $derived.by(() => {
		const items: string[] = [];
		const recipeCount = cardData?.recipeCount ?? 0;
		items.push(`${recipeCount} recipe${recipeCount === 1 ? '' : 's'}`);
		return items;
	});

	onMount(async () => {
		if (!cardData && item.cardData?.uri && parsedUri?.repo) {
			const loadedData = (await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did: parsedUri.repo as Did,
				handle: ''
			})) as Record<string, KichRecipeCollectionCardData> | undefined;

			if (loadedData?.[item.id]) {
				fetchedCollection = loadedData[item.id];
				if (!data[item.cardType]) {
					data[item.cardType] = {};
				}
				(data[item.cardType] as Record<string, KichRecipeCollectionCardData>)[item.id] =
					fetchedCollection;
			}
		}
		isLoaded = true;
	});
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Nunito:wght@900&display=swap"
	/>
</svelte:head>

<div class="flex h-full flex-col overflow-hidden">
	{#if cardData}
		<a
			href={collectionUrl}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Open collection on Kich"
			class="relative block min-h-0 flex-1"
		>
			{#if imageUrl}
				<img src={imageUrl} alt={title} class="rounded-top-xl h-full w-full object-cover" />
			{:else}
				<div
					class="rounded-top-xl from-base-300 to-base-200 dark:from-base-800 dark:to-base-900 h-full w-full bg-gradient-to-br"
				></div>
			{/if}

			<div class="image-overlay pointer-events-none absolute inset-0"></div>

			<div class="absolute right-0 bottom-0 left-0 p-4">
				{#if metaItems.length > 0}
					<div class="mb-1 flex flex-wrap gap-2 text-xs">
						{#each metaItems as meta, index (`meta-${index}`)}
							<span class="rounded-full bg-black/30 px-2 py-1 text-white/95">{meta}</span>
						{/each}
					</div>
				{/if}

				<h3 class="line-clamp-2 text-xl font-semibold text-white">{title}</h3>
				{#if description}
					<p class="mt-1 line-clamp-2 text-sm text-white/90">{description}</p>
				{/if}
			</div>
		</a>
	{:else if isLoaded}
		<div class="flex h-full items-center justify-center">
			<p class="text-base-500 dark:text-base-400 text-center text-sm">Collection not found</p>
		</div>
	{:else}
		<div class="flex h-full items-center justify-center">
			<p class="text-base-500 dark:text-base-400 text-center text-sm">Loading collection...</p>
		</div>
	{/if}
</div>

<style>
	.kich-wordmark {
		font-family: 'Nunito', sans-serif;
		font-weight: 900;
	}

	.image-overlay {
		background: linear-gradient(
			to top,
			rgba(0, 0, 0, 0.9),
			rgba(0, 0, 0, 0.16) 40%,
			rgba(0, 0, 0, 0)
		);
	}
</style>
