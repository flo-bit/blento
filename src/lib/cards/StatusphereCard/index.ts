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

	createNew: (item) => {},

	loadData: async (items, { did }) => {
		const data = await listRecords({ did, collection: 'xyz.statusphere.status', limit: 1 });

		return data[0];
	},
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
	canHaveLabel: true,

	name: 'Emoji',
	keywords: ['status', 'mood', 'reaction', 'statusphere'],
	groups: ['Media'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>`
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
