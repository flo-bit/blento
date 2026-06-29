import type { CardDefinition } from '../../types';
import { getRecord, getBlobURL } from '$lib/atproto';
import RPGActorCard from './RPGActorCard.svelte';
import type { Did } from '@atcute/lexicons';

export type RpgSpriteRecord = {
	rows: number;
	columns: number;
	frames: number;
	width: number;
	height: number;
	frameWidth: number;
	frameHeight: number;
	isCustom?: boolean;
	createdAt?: string;
	spriteSheet: {
		$type: 'blob';
		ref: { $link: string };
		mimeType: string;
		size: number;
	};
};

export type RpgActorData = {
	sprite: RpgSpriteRecord;
	url: string;
} | null;

export const RPGActorCardDefinition = {
	type: 'rpgActor',
	contentComponent: RPGActorCard,

	createNew: (item) => {
		item.w = 4;
		item.h = 2;
		item.mobileW = 8;
		item.mobileH = 2;
	},

	loadData: async (_items, { did }) => {
		try {
			const record = await getRecord({
				did: did as Did,
				collection: 'actor.rpg.sprite',
				rkey: 'self'
			});
			const value = record?.value as RpgSpriteRecord | undefined;
			if (!value?.spriteSheet) return null;
			const url = await getBlobURL({
				did: did as Did,
				blob: value.spriteSheet
			});
			return { sprite: value, url } satisfies RpgActorData;
		} catch {
			return null;
		}
	},
	cacheLoadData: true,

	minW: 2,
	minH: 1,

	name: 'RPG Character',
	keywords: ['rpg', 'sprite', 'character', 'actor', 'avatar', 'pixel', 'game'],
	groups: ['Social'],
	canHaveLabel: true,
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>`
} as CardDefinition & { type: 'rpgActor' };
