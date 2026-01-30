// animated emojis from
// https://googlefonts.github.io/noto-emoji-animation/

import type { CardDefinition } from '../types';
import { listRecords, putRecord } from '$lib/atproto';
import StatusphereCard from './StatusphereCard.svelte';
import EditStatusphereCard from './EditStatusphereCard.svelte';
import icons from './icons.json';
import * as TID from '@atcute/tid';

export const StatusphereCardDefinition = {
	type: 'statusphere',
	contentComponent: StatusphereCard,
	editingContentComponent: EditStatusphereCard,

	createNew: (item) => {
		item.h = 3;
		item.mobileH = 5;
	},

	loadData: async (items, { did }) => {
		const data = await listRecords({ did, collection: 'xyz.statusphere.status', limit: 1 });

		return data[0];
	},
	sidebarButtonText: 'Statusphere',

	upload: async (item) => {
		if (item.cardData.hasUpdate) {
			await putRecord({
				rkey: TID.now(),
				collection: 'xyz.statusphere.status',
				record: {
					status: item.cardData.emoji,
					createdAt: new Date().toISOString()
				}
			});
			delete item.cardData.hasUpdate;
			// Keep item.cardData.emoji so each card can have its own status
		}

		return item;
	},

	migrate: (item) => {
		if (item.cardData.title && !item.cardData.label) {
			item.cardData.label = item.cardData.title;
		}
	},
	canHaveLabel: true
} as CardDefinition & { type: 'statusphere' };

export function emojiToNotoAnimatedWebp(emoji: string | undefined): string | undefined {
	if (!emoji) return;
	// Convert emoji to lowercase hex codepoints joined by "-"
	const codepoints: string[] = [];
	for (const char of emoji) {
		codepoints.push(char.codePointAt(0)!.toString(16).toLowerCase());
	}

	let key = codepoints.join('_');

	if (icons.icons.find((v) => v.codepoint == key)) {
		return `https://fonts.gstatic.com/s/e/notoemoji/latest/${key}/512.webp`;
	}

	key = codepoints.filter((cp) => cp !== 'fe0f' && cp !== 'fe0e').join('_');
	if (icons.icons.find((v) => v.codepoint == key))
		return `https://fonts.gstatic.com/s/e/notoemoji/latest/${key}/512.webp`;
}
