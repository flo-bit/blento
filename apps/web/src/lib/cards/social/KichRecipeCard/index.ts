import { getRecord, parseUri, resolveHandle } from '$lib/atproto';
import type { Did, Handle } from '@atcute/lexicons';
import type { CardDefinition } from '../../types';
import CreateKichRecipeCardModal from './CreateKichRecipeCardModal.svelte';
import KichRecipeCard from './KichRecipeCard.svelte';

const KICH_RECIPE_COLLECTION = 'io.kich.recipe.recipe';

export type KichBlob = {
	$type: 'blob';
	ref: {
		$link: string;
	};
	mimeType?: string;
	size?: number;
};

export type KichRecipeInstructionStep = {
	id: string;
	value: string;
};

export type KichRecipeIngredient = {
	id: string;
	name: string;
	grams?: number;
	measuredAmount?: number;
	measuredUnit?: string;
	heuristicAmount?: number;
	heuristicUnit?: string;
	notes?: string;
	group?: string;
	isDetached?: boolean;
	isOptional?: boolean;
};

export type KichRecipeTag = {
	id: string;
	name: string;
};

export type KichRecipeRecord = {
	name?: string;
	description?: string;
	servings?: number;
	prepTimeMinutes?: number;
	cookTimeMinutes?: number;
	instructions?: KichRecipeInstructionStep[];
	ingredients?: KichRecipeIngredient[];
	imageUrl?: string;
	images?: KichBlob[];
	source?: string;
	url?: string;
	isPrivate?: boolean;
	createdAt?: string;
	updatedAt?: string;
	tags?: KichRecipeTag[];
};

export const KichRecipeCardDefinition = {
	type: 'kichRecipe',
	contentComponent: KichRecipeCard,
	creationModalComponent: CreateKichRecipeCardModal,
	createNew: (card) => {
		card.cardType = 'kichRecipe';
		card.w = 4;
		card.h = 5;
		card.mobileW = 8;
		card.mobileH = 6;
	},
	loadData: async (items) => {
		const recipesById: Record<string, KichRecipeRecord> = {};

		for (const item of items) {
			const uri = item.cardData?.uri;
			if (!uri || typeof uri !== 'string') continue;

			const parsed = parseUri(uri);
			if (!parsed || parsed.collection !== KICH_RECIPE_COLLECTION || !parsed.repo || !parsed.rkey)
				continue;

			try {
				const did = parsed.repo.startsWith('did:')
					? parsed.repo
					: await resolveHandle({ handle: parsed.repo as Handle }).catch(() => undefined);
				if (!did) continue;

				const record = await getRecord({
					did: did as Did,
					collection: KICH_RECIPE_COLLECTION,
					rkey: parsed.rkey
				});

				if (record?.value) {
					recipesById[item.id] = record.value as KichRecipeRecord;
				}
			} catch {
				// Ignore individual recipe fetch failures to avoid blocking other cards.
			}
		}

		return recipesById;
	},
	onUrlHandler: (url, item) => {
		const atUriMatch = url.match(/^at:\/\/(did:[^/]+)\/([^/]+)\/([^/?#]+)/);
		const kichUrlMatch = url.match(
			/^https?:\/\/(?:www\.)?kich\.io\/profile\/([^/]+)\/recipe\/([^/?#]+)\/?$/i
		);

		let authority: string;
		let rkey: string;
		if (atUriMatch) {
			const [, did, collection, matchedRkey] = atUriMatch;
			if (collection !== KICH_RECIPE_COLLECTION) return null;
			authority = did;
			rkey = matchedRkey;
		} else if (kichUrlMatch) {
			authority = decodeURIComponent(kichUrlMatch[1]);
			rkey = kichUrlMatch[2];
		} else {
			return null;
		}

		item.w = 4;
		item.h = 5;
		item.mobileW = 8;
		item.mobileH = 6;
		item.cardType = 'kichRecipe';
		item.cardData.uri = `at://${authority}/${KICH_RECIPE_COLLECTION}/${rkey}`;
		item.cardData.kichHandle = authority;
		item.cardData.href = `https://kich.io/profile/${authority}/recipe/${rkey}`;
		return item;
	},
	urlHandlerPriority: 5,
	name: 'Kich Recipe',
	canHaveLabel: true,
	keywords: ['kich', 'recipe', 'food', 'cooking'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a5.25 5.25 0 0 0-5.25 5.25v.75a5.25 5.25 0 0 0 10.5 0V12A5.25 5.25 0 0 0 12 6.75Zm0 0V3m0 3.75c.966 0 1.75-.784 1.75-1.75S12.966 3.25 12 3.25s-1.75.784-1.75 1.75.784 1.75 1.75 1.75ZM4.5 12h2.25m10.5 0h2.25M6.697 17.303l1.591-1.591m7.424 0 1.591 1.591M8.288 8.288 6.697 6.697m10.606 0-1.591 1.591" /></svg>`
} as CardDefinition & { type: 'kichRecipe' };
