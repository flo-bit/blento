import { getRecord, listRecords, parseUri } from '$lib/atproto';
import type { CardDefinition } from '../../types';
import StandardSiteDocumentListCard from './StandardSiteDocumentListCard.svelte';

export const StandardSiteDocumentListCardDefinition = {
	type: 'publicationList',
	contentComponent: StandardSiteDocumentListCard,
	createNew: (card) => {
		card.w = 4;
		card.mobileW = 8;
		card.mobileH = 6;
	},

	loadData: async (items, { did }) => {
		const records = await listRecords({ did, collection: 'site.standard.document' });

		const publications: Record<string, string> = {};
		for (const record of records) {
			const site = record.value.site as string;

			if (site.startsWith('at://')) {
				if (!publications[site]) {
					const siteParts = parseUri(site);

					if (!siteParts) continue;

					const publicationRecord = await getRecord({
						did: siteParts.repo as `did:${string}:${string}`,
						collection: siteParts.collection!,
						rkey: siteParts.rkey
					});

					if (!publicationRecord.value) continue;

					publications[site] = publicationRecord.value.url as string;
				}

				record.value.href = publications[site] + record.value.path;
			} else {
				record.value.href = site + record.value.path;
			}
		}

		return records.filter((r) => r.value?.href);
	},

	name: 'Blog Posts',

	keywords: ['articles', 'writing', 'blog', 'posts', 'frontpage'],
	groups: ['Content'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`
} as CardDefinition & { type: 'site.standard.document list' };
