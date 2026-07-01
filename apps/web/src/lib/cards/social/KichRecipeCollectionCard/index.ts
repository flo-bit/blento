import { getRecord, listRecords, parseUri, resolveHandle } from '$lib/atproto';
import type { Did, Handle } from '@atcute/lexicons';
import type { CardDefinition } from '../../types';
import CreateKichRecipeCollectionCardModal from './CreateKichRecipeCollectionCardModal.svelte';
import KichRecipeCollectionCard from './KichRecipeCollectionCard.svelte';

const KICH_RECIPE_COLLECTION_COLLECTION = 'io.kich.recipe.collection';
const KICH_COLLECTION_ITEM_COLLECTIONS = [
	'io.kich.recipe.collectionitem',
	'io.kich.recipe.collection.recipe',
	'io.kich.recipe.recipecollectionitem'
] as const;

export type KichBlob = {
	$type: 'blob';
	ref: {
		$link: string;
	};
	mimeType?: string;
	size?: number;
};

export type KichRecipeCollectionRecord = {
	name?: string;
	description?: string;
	image?: KichBlob;
	createdAt?: string;
	updatedAt?: string;
};

export type KichRecipeCollectionCardData = {
	collection: KichRecipeCollectionRecord;
	recipeCount: number;
};

export const KichRecipeCollectionCardDefinition = {
	type: 'kichRecipeCollection',
	contentComponent: KichRecipeCollectionCard,
	creationModalComponent: CreateKichRecipeCollectionCardModal,
	createNew: (card) => {
		card.cardType = 'kichRecipeCollection';
		card.w = 4;
		card.h = 3;
		card.mobileW = 8;
		card.mobileH = 4;
	},
	loadData: async (items) => {
		const collectionsById: Record<string, KichRecipeCollectionCardData> = {};

		for (const item of items) {
			const uri = item.cardData?.uri;
			if (!uri || typeof uri !== 'string') continue;

			const parsed = parseUri(uri);
			if (
				!parsed ||
				parsed.collection !== KICH_RECIPE_COLLECTION_COLLECTION ||
				!parsed.repo ||
				!parsed.rkey
			) {
				continue;
			}

			try {
				const did = parsed.repo.startsWith('did:')
					? parsed.repo
					: await resolveHandle({ handle: parsed.repo as Handle }).catch(() => undefined);
				if (!did) continue;

				const record = await getRecord({
					did: did as Did,
					collection: KICH_RECIPE_COLLECTION_COLLECTION,
					rkey: parsed.rkey
				});

				if (!record?.value) continue;

				const recipeCount = await getCollectionRecipeCount({
					did: did as Did,
					collectionRkey: parsed.rkey
				});

				collectionsById[item.id] = {
					collection: record.value as KichRecipeCollectionRecord,
					recipeCount
				};
			} catch {
				// Ignore individual collection fetch failures.
			}
		}

		return collectionsById;
	},
	onUrlHandler: (url, item) => {
		const atUriMatch = url.match(/^at:\/\/(did:[^/]+)\/([^/]+)\/([^/?#]+)/);
		const kichUrlMatch = url.match(
			/^https?:\/\/(?:www\.)?kich\.io\/profile\/([^/]+)\/collection\/([^/?#]+)\/?$/i
		);

		let authority: string;
		let rkey: string;
		if (atUriMatch) {
			const [, did, collection, matchedRkey] = atUriMatch;
			if (collection !== KICH_RECIPE_COLLECTION_COLLECTION) return null;
			authority = did;
			rkey = matchedRkey;
		} else if (kichUrlMatch) {
			authority = decodeURIComponent(kichUrlMatch[1]);
			rkey = kichUrlMatch[2];
		} else {
			return null;
		}

		item.w = 4;
		item.h = 3;
		item.mobileW = 8;
		item.mobileH = 4;
		item.cardType = 'kichRecipeCollection';
		item.cardData.uri = `at://${authority}/${KICH_RECIPE_COLLECTION_COLLECTION}/${rkey}`;
		item.cardData.kichHandle = authority;
		item.cardData.href = `https://kich.io/profile/${authority}/collection/${rkey}`;
		return item;
	},
	urlHandlerPriority: 5,
	name: 'Kich Recipe Collection',
	canHaveLabel: true,
	keywords: ['kich', 'recipe', 'collection', 'cookbook'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15A2.25 2.25 0 0 1 21.75 6.75v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h6" /></svg>`
} as CardDefinition & { type: 'kichRecipeCollection' };

async function getCollectionRecipeCount({
	did,
	collectionRkey
}: {
	did: Did;
	collectionRkey: string;
}): Promise<number> {
	const collectionUri = `at://${did}/${KICH_RECIPE_COLLECTION_COLLECTION}/${collectionRkey}`;

	for (const collectionName of KICH_COLLECTION_ITEM_COLLECTIONS) {
		try {
			const records = (await listRecords({
				did,
				collection: collectionName as `${string}.${string}.${string}`,
				limit: 0
			})) as Array<{ value?: unknown }>;

			if (!records?.length) continue;

			const count = records.reduce((acc, record) => {
				return (
					acc + (recordBelongsToCollection(record.value, collectionUri, collectionRkey) ? 1 : 0)
				);
			}, 0);

			if (count > 0) return count;
		} catch {
			// Try next candidate collection.
		}
	}

	return 0;
}

function recordBelongsToCollection(
	value: unknown,
	collectionUri: string,
	collectionRkey: string
): boolean {
	if (!value || typeof value !== 'object') return false;
	const node = value as Record<string, unknown>;

	const directCandidates = [
		node.collection,
		node.collectionUri,
		node.collectionRkey,
		node.collectionRef,
		node.parentCollection,
		node.list,
		node.subject,
		node.ref
	];

	if (
		directCandidates.some((candidate) =>
			matchesCollectionRef(candidate, collectionUri, collectionRkey)
		)
	) {
		return true;
	}

	// Last resort: check all top-level values for a matching collection ref.
	return Object.values(node).some((candidate) =>
		matchesCollectionRef(candidate, collectionUri, collectionRkey)
	);
}

function matchesCollectionRef(
	ref: unknown,
	collectionUri: string,
	collectionRkey: string
): boolean {
	if (!ref) return false;

	if (typeof ref === 'string') {
		if (ref === collectionUri || ref === collectionRkey) return true;
		const parsed = parseUri(ref);
		return (
			parsed?.collection === KICH_RECIPE_COLLECTION_COLLECTION && parsed?.rkey === collectionRkey
		);
	}

	if (typeof ref === 'object') {
		const node = ref as Record<string, unknown>;
		return (
			matchesCollectionRef(node.uri, collectionUri, collectionRkey) ||
			matchesCollectionRef(node.rkey, collectionUri, collectionRkey) ||
			matchesCollectionRef(node.$link, collectionUri, collectionRkey)
		);
	}

	return false;
}
