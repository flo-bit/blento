<script lang="ts">
	import { onMount } from 'svelte';
	import { CardDefinitionsByType } from '../..';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import type { ContentComponentProps } from '../../types';
	import type { KichCookingLogEntry } from '.';

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	const did = getDidContext();
	const handle = getHandleContext();

	let clientLogs = $state<KichCookingLogEntry[] | undefined>(undefined);
	let logs = $derived(
		clientLogs ?? (data[item.cardType] as KichCookingLogEntry[] | undefined) ?? []
	);
	let isLoading = $state(false);
	let isLoaded = $state(false);

	onMount(async () => {
		if (logs.length === 0) {
			isLoading = true;
			const loaded = (await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did,
				handle
			})) as KichCookingLogEntry[] | undefined;
			clientLogs = loaded ?? [];
			data[item.cardType] = clientLogs;
			isLoading = false;
		}
		isLoaded = true;
	});

	function getRecipeUrl(entry: KichCookingLogEntry): string {
		if (!entry.recipeRkey) return entry.recipeUri;
		const actor =
			entry.recipeRepo && entry.recipeRepo.startsWith('did:')
				? entry.recipeRepo === did
					? handle
					: entry.recipeRepo
				: entry.recipeRepo || handle;
		return `https://kich.io/profile/${actor}/recipe/${entry.recipeRkey}`;
	}

	function getImageUrl(entry: KichCookingLogEntry): string | undefined {
		if (!entry.recipeRepo || !entry.recipe) return entry.recipe?.imageUrl;
		const first = entry.recipe.images?.[0];
		if (!first?.ref?.$link) return entry.recipe.imageUrl;
		return `https://cdn.bsky.app/img/feed_thumbnail/plain/${entry.recipeRepo}/${first.ref.$link}@jpeg`;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		if (Number.isNaN(date.getTime())) return 'recently';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<div class="h-full w-full p-4">
	{#if logs.length > 0}
		<div class="logs-list">
			{#each logs as entry, index (`log-${index}`)}
				<a
					href={getRecipeUrl(entry)}
					target="_blank"
					rel="noopener noreferrer"
					class="log-card relative block aspect-video shrink-0 overflow-hidden rounded-xl"
				>
					{#if getImageUrl(entry)}
						<img
							src={getImageUrl(entry)}
							alt={entry.recipe?.name || 'Recipe'}
							class="absolute inset-0 h-full w-full object-cover"
						/>
					{:else}
						<div
							class="from-base-300 to-base-200 dark:from-base-800 dark:to-base-900 absolute inset-0 bg-gradient-to-br"
						></div>
					{/if}
					<div class="log-overlay pointer-events-none absolute inset-0"></div>
					<div class="absolute right-0 bottom-0 left-0 p-3">
						<div class="mb-2 flex flex-wrap gap-1 text-[11px]">
							<span class="rounded-full bg-black/30 px-2 py-0.5 text-white/95">
								{formatDate(entry.createdAt)}
							</span>
							{#if entry.scaledServings}
								<span class="rounded-full bg-black/30 px-2 py-0.5 text-white/95">
									{entry.scaledServings} servings
								</span>
							{/if}
							{#if entry.recipe?.servings !== undefined}
								<span class="rounded-full bg-black/30 px-2 py-0.5 text-white/95">
									Servings {entry.recipe.servings}
								</span>
							{/if}
						</div>
						<h3 class="line-clamp-2 text-sm font-semibold text-white">
							{entry.recipe?.name || 'Cooked recipe'}
						</h3>
						{#if entry.notes}
							<p class="mt-1 line-clamp-2 text-xs text-white/90">
								{entry.notes}
							</p>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{:else if isLoaded && !isLoading}
		<div
			class="text-base-500 dark:text-base-400 flex h-full items-center justify-center text-center text-sm"
		>
			No cooking logs yet
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 flex h-full items-center justify-center text-center text-sm"
		>
			Loading cooking logs...
		</div>
	{/if}
</div>

<style>
	.logs-list {
		display: flex;
		height: 100%;
		min-height: 0;
		flex-direction: column;
		gap: 0.75rem;
		overflow-y: auto;
	}

	.log-card {
		flex: 0 0 auto;
	}

	.log-overlay {
		background: linear-gradient(
			to top,
			rgba(0, 0, 0, 0.9),
			rgba(0, 0, 0, 0.16) 60%,
			rgba(0, 0, 0, 0)
		);
	}

	@container card (aspect-ratio > 1/1) {
		.logs-list {
			flex-direction: row;
			overflow-x: auto;
			overflow-y: hidden;
			scroll-snap-type: x mandatory;
		}

		.log-card {
			width: min(24rem, 78%);
			scroll-snap-align: start;
		}
	}
</style>
