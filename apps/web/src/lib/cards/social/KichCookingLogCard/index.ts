import { getRecord, listRecords, parseUri, resolveHandle } from '$lib/atproto';
import type { Did, Handle } from '@atcute/lexicons';
import type { CardDefinition } from '../../types';
import KichCookingLogCard from './KichCookingLogCard.svelte';

const KICH_COOKING_LOG_COLLECTION = 'io.kich.cookinglog';
const KICH_RECIPE_COLLECTION = 'io.kich.recipe.recipe';

type StrongRef = {
	uri: string;
	cid?: string;
};

type KichBlob = {
	$type: 'blob';
	ref: {
		$link: string;
	};
	mimeType?: string;
	size?: number;
};

type KichRecipeRecord = {
	name?: string;
	description?: string;
	imageUrl?: string;
	images?: KichBlob[];
	servings?: number;
};

export type KichCookingLogRecord = {
	subject: StrongRef;
	scaledServings?: unknown;
	notes?: string;
	createdAt: string;
};

export type KichCookingLogEntry = {
	logUri: string;
	createdAt: string;
	notes?: string;
	scaledServings?: string;
	recipeUri: string;
	recipeRepo?: string;
	recipeRkey?: string;
	recipe?: KichRecipeRecord;
};

export const KichCookingLogCardDefinition = {
	type: 'kichCookingLog',
	contentComponent: KichCookingLogCard,
	createNew: (card) => {
		card.cardType = 'kichCookingLog';
		card.w = 4;
		card.h = 4;
		card.mobileW = 8;
		card.mobileH = 6;
		card.cardData.label = 'Cooking Log';
	},
	loadData: async (_items, { did }) => {
		const records = (await listRecords({
			did,
			collection: KICH_COOKING_LOG_COLLECTION,
			limit: 50
		})) as Array<{
			uri?: string;
			value?: unknown;
		}>;

		const logs: KichCookingLogEntry[] = [];
		const recipeCache = new Map<string, KichRecipeRecord>();

		for (const record of records) {
			const value = record.value as KichCookingLogRecord | undefined;
			if (!value?.subject?.uri || !value.createdAt) continue;

			const parsedRecipe = parseUri(value.subject.uri);
			if (
				!parsedRecipe ||
				parsedRecipe.collection !== KICH_RECIPE_COLLECTION ||
				!parsedRecipe.repo ||
				!parsedRecipe.rkey
			) {
				continue;
			}

			const recipe = await loadRecipe({
				repo: parsedRecipe.repo,
				rkey: parsedRecipe.rkey,
				cache: recipeCache
			});

			logs.push({
				logUri: record.uri ?? '',
				createdAt: value.createdAt,
				notes: value.notes,
				scaledServings:
					value.scaledServings === undefined || value.scaledServings === null
						? undefined
						: String(value.scaledServings),
				recipeUri: value.subject.uri,
				recipeRepo: parsedRecipe.repo,
				recipeRkey: parsedRecipe.rkey,
				recipe
			});
		}

		return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	},
	canAdd: ({ collections }) => collections.includes(KICH_COOKING_LOG_COLLECTION),
	name: 'Kich Cooking Log',
	canHaveLabel: true,
	keywords: ['kich', 'cooking', 'log', 'recipes', 'history'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" /></svg>`
} as CardDefinition & { type: 'kichCookingLog' };

async function loadRecipe({
	repo,
	rkey,
	cache
}: {
	repo: string;
	rkey: string;
	cache: Map<string, KichRecipeRecord>;
}): Promise<KichRecipeRecord | undefined> {
	const key = `${repo}:${rkey}`;
	if (cache.has(key)) return cache.get(key);

	const resolvedDid = repo.startsWith('did:')
		? repo
		: await resolveHandle({ handle: repo as Handle }).catch(() => undefined);
	if (!resolvedDid) return undefined;

	const recipeRecord = await getRecord({
		did: resolvedDid as Did,
		collection: KICH_RECIPE_COLLECTION,
		rkey
	}).catch(() => undefined);

	const recipe = recipeRecord?.value as KichRecipeRecord | undefined;
	if (recipe) cache.set(key, recipe);
	return recipe;
}
