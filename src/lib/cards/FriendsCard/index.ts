import type { CardDefinition } from '../types';
import type { Did } from '@atcute/lexicons';
import { getBlentoOrBskyProfile } from '$lib/atproto/methods';
import FriendsCard from './FriendsCard.svelte';
import FriendsCardSettings from './FriendsCardSettings.svelte';

export type FriendsProfile = Awaited<ReturnType<typeof getBlentoOrBskyProfile>>;

export const FriendsCardDefinition = {
	type: 'friends',
	contentComponent: FriendsCard,
	settingsComponent: FriendsCardSettings,
	createNew: (card) => {
		card.w = 4;
		card.h = 2;
		card.mobileW = 8;
		card.mobileH = 4;
		card.cardData.friends = [];
	},
	loadData: async (items) => {
		const allDids = new Set<Did>();
		for (const item of items) {
			for (const did of item.cardData.friends ?? []) {
				allDids.add(did as Did);
			}
		}
		if (allDids.size === 0) return [];

		const profiles = await Promise.all(
			Array.from(allDids).map((did) =>
				getBlentoOrBskyProfile({ did }).catch(() => undefined)
			)
		);
		return profiles.filter((p) => p && p.handle !== 'handle.invalid');
	},
	allowSetColor: true,
	defaultColor: 'base',
	minW: 2,
	minH: 2,
	name: 'Friends',
	groups: ['Social'],
	keywords: ['friends', 'avatars', 'people', 'community', 'blentos'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>`
} as CardDefinition & { type: 'friends' };
