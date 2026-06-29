import { getRecord, listRecords, parseUri, resolveHandle } from '$lib/atproto';
import type { Did, Handle } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';

interface GalleryItem {
	value: {
		gallery: string;
		item: string;
		position?: number;
	};
}

// Parse grain.social gallery URLs
// https://grain.social/profile/atproto.boston/gallery/3megtiuwqs62w
export function parseGrainGalleryUrl(url: string): { handle: string; rkey: string } | null {
	const match = url.match(/grain\.social\/profile\/([^/]+)\/gallery\/([A-Za-z0-9]+)/);
	if (!match) return null;
	return { handle: match[1], rkey: match[2] };
}

export async function loadGrainGalleryData(items: { cardData: Record<string, unknown> }[]) {
	const itemsData: Record<string, unknown[]> = {};

	const galleryItems: Record<string, GalleryItem[] | undefined> = {
		'social.grain.gallery.item': undefined
	};

	for (const item of items) {
		if (!item.cardData.galleryUri) continue;

		const galleryUri = item.cardData.galleryUri as string;
		const parsedUri = parseUri(galleryUri);

		if (parsedUri?.collection === 'social.grain.gallery') {
			let repo = parsedUri.repo;

			// Resolve handle to DID if needed
			if (!isDid(repo)) {
				const did = await resolveHandle({ handle: repo as Handle });
				if (!did) continue;
				repo = did;
			}

			// Construct DID-based URI for filtering (PDS records use DID-based URIs)
			const didBasedGalleryUri = `at://${repo}/social.grain.gallery/${parsedUri.rkey}`;

			const itemCollection = 'social.grain.gallery.item';

			if (!galleryItems[itemCollection]) {
				galleryItems[itemCollection] = (await listRecords({
					did: repo as Did,
					collection: itemCollection
				})) as unknown as GalleryItem[];
			}

			const galleryItemsList = galleryItems['social.grain.gallery.item'];
			if (!galleryItemsList) continue;

			const images = galleryItemsList
				.filter((i) => i.value.gallery === didBasedGalleryUri)
				.map(async (i) => {
					const itemData = parseUri(i.value.item);
					if (!itemData) return null;
					const record = await getRecord({
						did: itemData.repo as Did,
						collection: itemData.collection!,
						rkey: itemData.rkey
					});
					return { ...record, value: { ...record.value, ...i.value } };
				});

			// Store under original key so the component can look it up
			itemsData[galleryUri] = await Promise.all(images);
		}
	}

	return itemsData;
}
