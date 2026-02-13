import type { CardDefinition } from '../../types';
import { listRecords, getRecord, resolveHandle } from '$lib/atproto';
import SembleCollectionCard from './SembleCollectionCard.svelte';
import CreateSembleCollectionCardModal from './CreateSembleCollectionCardModal.svelte';

export type SembleCard = {
	uri: string;
	type: 'URL' | 'NOTE';
	url?: string;
	title?: string;
	description?: string;
	imageUrl?: string;
	siteName?: string;
	text?: string;
	createdAt?: string;
};

export type SembleCollectionData = {
	name: string;
	description?: string;
	cards: SembleCard[];
};

function parseSembleUrl(url: string) {
	const match = url.match(/^https?:\/\/semble\.so\/profile\/([^/]+)\/collections\/([a-z0-9]+)$/);
	if (!match) return null;
	return { handle: match[1], rkey: match[2] };
}

async function loadCollectionData(
	handle: string,
	collectionRkey: string
): Promise<SembleCollectionData | undefined> {
	const did = await resolveHandle({ handle: handle as `${string}.${string}` });
	if (!did) return undefined;

	const collectionUri = `at://${did}/network.cosmik.collection/${collectionRkey}`;

	const [collection, allLinks, allCards] = await Promise.all([
		getRecord({
			did,
			collection: 'network.cosmik.collection',
			rkey: collectionRkey
		}).catch(() => undefined),
		listRecords({ did, collection: 'network.cosmik.collectionLink' }).catch(() => []),
		listRecords({ did, collection: 'network.cosmik.card' }).catch(() => [])
	]);

	if (!collection) return undefined;

	const linkedCardUris = new Set(
		allLinks
			.filter((link: any) => link.value.collection?.uri === collectionUri)
			.map((link: any) => link.value.card?.uri)
	);

	const cards: SembleCard[] = allCards
		.filter((card: any) => linkedCardUris.has(card.uri))
		.map((card: any) => {
			const v = card.value;
			const content = v.content;
			if (v.type === 'URL') {
				return {
					uri: card.uri,
					type: 'URL' as const,
					url: content?.url,
					title: content?.metadata?.title,
					description: content?.metadata?.description,
					imageUrl: content?.metadata?.imageUrl,
					siteName: content?.metadata?.siteName,
					createdAt: v.createdAt
				};
			}
			return {
				uri: card.uri,
				type: 'NOTE' as const,
				text: content?.text,
				createdAt: v.createdAt
			};
		});

	return {
		name: collection.value.name as string,
		description: collection.value.description as string | undefined,
		cards
	};
}

export const SembleCollectionCardDefinition = {
	type: 'sembleCollection',
	contentComponent: SembleCollectionCard,
	creationModalComponent: CreateSembleCollectionCardModal,
	createNew: (card) => {
		card.w = 4;
		card.mobileW = 8;
		card.h = 4;
		card.mobileH = 6;
	},
	loadData: async (items) => {
		const results: Record<string, SembleCollectionData> = {};
		for (const item of items) {
			const handle = item.cardData.handle;
			const rkey = item.cardData.collectionRkey;
			if (!handle || !rkey) continue;
			try {
				const data = await loadCollectionData(handle, rkey);
				if (data) results[`${handle}/${rkey}`] = data;
			} catch {
				// skip failed fetches
			}
		}
		return results;
	},
	onUrlHandler: (url, item) => {
		const parsed = parseSembleUrl(url);
		if (!parsed) return null;
		item.cardData.handle = parsed.handle;
		item.cardData.collectionRkey = parsed.rkey;
		item.cardData.href = url;
		item.w = 4;
		item.mobileW = 8;
		item.h = 4;
		item.mobileH = 6;
		return item;
	},
	urlHandlerPriority: 5,
	minH: 2,

	keywords: ['semble', 'collection', 'bookmarks', 'links', 'cards', 'cosmik'],
	groups: ['Social'],
	name: 'Semble Collection',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>`
} as CardDefinition & { type: 'sembleCollection' };
