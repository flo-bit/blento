<script lang="ts">
	import { onMount } from 'svelte';
	import { parseUri } from '$lib/atproto';
	import type { Did } from '@atcute/lexicons';
	import { CardDefinitionsByType } from '../..';
	import { getAdditionalUserData } from '$lib/website/context';
	import type { ContentComponentProps } from '../../types';
	import type { KichBlob, KichRecipeIngredient, KichRecipeRecord } from '.';

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	let parsedUri = $derived(item.cardData?.uri ? parseUri(item.cardData.uri) : null);

	let fetchedRecipe = $state<KichRecipeRecord | undefined>(undefined);
	let isLoaded = $state(false);

	let recipe = $derived(
		fetchedRecipe ||
			((data[item.cardType] as Record<string, KichRecipeRecord> | undefined)?.[item.id] as
				| KichRecipeRecord
				| undefined)
	);

	let title = $derived(recipe?.name || 'Recipe');
	let description = $derived(recipe?.description || '');

	let ingredientText = $derived.by(() => normalizeIngredients(recipe));
	let ingredientCount = $derived(recipe?.ingredients?.length ?? 0);

	let instructionText = $derived.by(() => normalizeInstructions(recipe));

	let imageUrl = $derived.by(() => {
		if (!parsedUri?.repo || !recipe) return undefined;

		const firstImage = recipe.images?.[0];
		if (firstImage?.ref?.$link) {
			return `https://cdn.bsky.app/img/feed_thumbnail/plain/${parsedUri.repo}/${firstImage.ref.$link}@jpeg`;
		}
		return recipe.imageUrl;
	});

	let prepareUrl = $derived.by(() => {
		if (item.cardData?.href && typeof item.cardData.href === 'string') {
			return item.cardData.href as string;
		}
		if (!parsedUri?.rkey) return 'https://kich.io';
		const handle = (item.cardData?.kichHandle as string | undefined) || parsedUri.repo;
		return `https://kich.io/profile/${handle}/recipe/${parsedUri.rkey}`;
	});

	let metaItems = $derived.by(() => {
		const items: string[] = [];
		if (recipe?.servings !== undefined) {
			items.push(`${recipe.servings} serving${recipe.servings === 1 ? '' : 's'}`);
		}
		if (recipe?.cookTimeMinutes !== undefined) {
			items.push(`${recipe.cookTimeMinutes} min cook`);
		}
		if (ingredientCount > 0) {
			items.push(`${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}`);
		}
		return items;
	});

	onMount(async () => {
		if (!recipe && item.cardData?.uri && parsedUri?.repo) {
			const loadedData = (await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did: parsedUri.repo as Did,
				handle: ''
			})) as Record<string, KichRecipeRecord> | undefined;

			if (loadedData?.[item.id]) {
				fetchedRecipe = loadedData[item.id];
				if (!data[item.cardType]) {
					data[item.cardType] = {};
				}
				(data[item.cardType] as Record<string, KichRecipeRecord>)[item.id] = fetchedRecipe;
			}
		}
		isLoaded = true;
	});

	function normalizeIngredients(recipeData?: KichRecipeRecord): string[] {
		if (!recipeData?.ingredients?.length) return [];
		return recipeData.ingredients.map(formatIngredient).filter((value) => value.length > 0);
	}

	function formatIngredient(ingredient: KichRecipeIngredient): string {
		const amount = ingredient.heuristicAmount ?? ingredient.measuredAmount ?? ingredient.grams;
		const unit =
			ingredient.heuristicUnit ??
			ingredient.measuredUnit ??
			(ingredient.grams !== undefined ? 'g' : undefined);

		const quantity = amount !== undefined ? `${amount}` : '';
		const quantityWithUnit = `${quantity}${unit ? ` ${unit}` : ''}`.trim();
		const base = quantityWithUnit ? `${quantityWithUnit} ${ingredient.name}` : ingredient.name;
		return ingredient.notes ? `${base} (${ingredient.notes})` : base;
	}

	function normalizeInstructions(recipeData?: KichRecipeRecord): string[] {
		if (!recipeData?.instructions?.length) return [];
		return recipeData.instructions
			.map((step) => step.value?.trim() ?? '')
			.filter((value) => value.length > 0);
	}
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Nunito:wght@900&display=swap"
	/>
</svelte:head>

<div class="flex h-full flex-col overflow-hidden" class:has-image={Boolean(imageUrl)}>
	{#if recipe}
		{#if imageUrl}
			<div class="recipe-image-wrap relative">
				<img
					src={imageUrl}
					alt={title}
					class="recipe-image rounded-top-xl aspect-16/9 w-full object-cover"
				/>
				<div class="image-overlay pointer-events-none absolute inset-0"></div>
				<div class="compact-overlay pointer-events-none absolute right-0 bottom-0 left-0 p-4">
					{#if metaItems.length > 0}
						<div class="mb-1 flex flex-wrap gap-2 text-xs">
							{#each metaItems as meta, index (`compact-meta-${index}`)}
								<span class="rounded-full bg-black/30 px-2 py-1 text-white/95">{meta}</span>
							{/each}
						</div>
					{/if}
					<h3 class="line-clamp-2 text-xl font-semibold text-white">{title}</h3>
					{#if description}
						<p class="mt-1 line-clamp-2 text-sm text-white/90">{description}</p>
					{/if}
				</div>
				<a
					href={prepareUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="recipe-image-hit-area absolute inset-0 z-20"
					aria-label="Open recipe on Kich"
				></a>
			</div>
		{/if}

		<div class="recipe-details flex min-h-0 flex-1 flex-col gap-2 pt-5">
			<div class="flex flex-col gap-2">
				<div class="flex items-start justify-between px-5">
					<h3
						class="kich-wordmark text-base-900 dark:text-base-50 line-clamp-2 text-2xl font-semibold"
					>
						{title}
					</h3>
					<a
						href={prepareUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="kich-wordmark kich-prepare-btn bg-accent-500 hover:bg-accent-600 text-base-50 rounded-xl px-2 py-1 font-medium"
					>
						Prepare
					</a>
				</div>

				{#if metaItems.length > 0}
					<div class="text-base-600 dark:text-base-300 flex flex-wrap gap-2 px-5 text-xs">
						{#each metaItems as meta, index (`meta-${index}`)}
							<span
								class="bg-base-200/70 dark:bg-base-800/70 accent:bg-base-50/20 rounded-full px-2 py-1"
							>
								{meta}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<div class="content-fade-wrap min-h-0 flex-1">
				<div class="h-full min-h-0 overflow-y-auto px-5 pb-6">
					{#if description}
						<p class="text-base-500 dark:text-base-300 mb-3 line-clamp-3">
							{description}
						</p>
					{/if}

					{#if ingredientText.length > 0}
						<div class="mb-3">
							<p
								class="text-base-700 dark:text-base-200 mb-1 text-xs font-semibold tracking-wide uppercase"
							>
								Ingredients
							</p>
							<ul class="text-base-600 dark:text-base-300 list-disc space-y-1 pl-4 text-sm">
								{#each ingredientText.slice(0, 6) as ingredient, index (`ingredient-${index}`)}
									<li><span class="line-clamp-1">{ingredient}</span></li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if instructionText.length > 0}
						<div>
							<p
								class="text-base-700 dark:text-base-200 mb-1 text-xs font-semibold tracking-wide uppercase"
							>
								Steps
							</p>
							<ol class="text-base-600 dark:text-base-300 list-decimal space-y-1 pl-4 text-sm">
								{#each instructionText.slice(0, 3) as step, index (`step-${index}`)}
									<li><span class="line-clamp-2">{step}</span></li>
								{/each}
							</ol>
						</div>
					{/if}
				</div>
				<div
					class="to-base-100 dark:to-base-900 accent:to-accent-500 pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-gradient-to-b from-transparent"
				></div>
			</div>
		</div>
	{:else if isLoaded}
		<div class="flex h-full items-center justify-center">
			<p class="text-base-500 dark:text-base-400 text-center text-sm">Recipe not found</p>
		</div>
	{:else}
		<div class="flex h-full items-center justify-center">
			<p class="text-base-500 dark:text-base-400 text-center text-sm">Loading recipe...</p>
		</div>
	{/if}
</div>

<style>
	.kich-wordmark {
		font-family: 'Nunito', sans-serif;
		font-weight: 900;
	}

	.content-fade-wrap {
		position: relative;
	}

	.image-overlay {
		display: none;
		background: linear-gradient(
			to top,
			rgba(0, 0, 0, 0.9),
			rgba(0, 0, 0, 0.16) 40%,
			rgba(0, 0, 0, 0)
		);
	}

	.compact-overlay {
		display: none;
	}

	.recipe-image-hit-area {
		display: none;
	}

	@container card (aspect-ratio > 1/1) {
		.has-image .recipe-image-wrap {
			min-height: 0;
			flex: 1;
			overflow: hidden;
		}

		.has-image .recipe-image {
			height: 100%;
			aspect-ratio: auto;
			transform-origin: center center;
			transition: transform 250ms ease-in-out;
		}

		@media (hover: hover) {
			.has-image .recipe-image-wrap:hover .recipe-image {
				transform: scale(1.03);
			}
		}

		.has-image .recipe-details {
			display: none;
		}

		.has-image .image-overlay {
			display: block;
		}

		.has-image .compact-overlay {
			display: block;
		}

		.has-image .recipe-image-hit-area {
			display: block;
		}

		.has-image .kich-prepare-btn {
			display: none;
		}
	}
</style>
