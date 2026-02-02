import type { CardDefinition } from '../types';
import BlueskyFeedCard from './BlueskyFeedCard.svelte';
import { getAuthorFeed, resolveHandle } from '$lib/atproto/methods';
import type { Did, Handle } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';

export const BlueskyFeedCardDefinition = {
	type: 'blueskyFeed',
	contentComponent: BlueskyFeedCard,
	createNew: (card) => {
		card.cardType = 'blueskyFeed';
		card.w = 4;
		card.mobileW = 8;
		card.h = 6;
		card.mobileH = 10;
	},

	onUrlHandler: (url, item) => {
		const match = url.match(/bsky\.app\/profile\/([^/]+)\/?$/);
		if (!match) return null;

		const actor = match[1];
		if (isDid(actor)) {
			item.cardData.did = actor;
		} else {
			item.cardData.handle = actor;
		}

		item.w = 4;
		item.mobileW = 8;
		item.h = 6;
		item.mobileH = 10;

		return item;
	},
	urlHandlerPriority: 1,

	loadData: async (items, { did }) => {
		// Map from original key (handle or did from cardData) to resolved DID
		const keysToDid = new Map<string, Did>();

		for (const item of items) {
			if (item.cardData?.did) {
				const d = item.cardData.did as Did;
				keysToDid.set(d, d);
			} else if (item.cardData?.handle) {
				try {
					const resolved = await resolveHandle({ handle: item.cardData.handle as Handle });
					keysToDid.set(item.cardData.handle as string, resolved);
				} catch {
					// skip unresolvable handles
				}
			} else {
				keysToDid.set(did, did);
			}
		}

		const result: Record<string, unknown> = {};
		const fetched = new Set<string>();

		await Promise.all(
			Array.from(keysToDid.entries()).map(async ([key, fetchDid]) => {
				try {
					let feedData;
					if (!fetched.has(fetchDid)) {
						feedData = await getAuthorFeed({
							did: fetchDid,
							filter: 'posts_no_replies',
							limit: 20
						});
						result[fetchDid] = feedData;
						fetched.add(fetchDid);
					} else {
						feedData = result[fetchDid];
					}
					// Also store under original key so the component can look it up
					if (key !== fetchDid) {
						result[key] = feedData;
					}
				} catch {
					// skip failed fetches
				}
			})
		);

		return result;
	},

	minW: 4,
	minH: 4,

	name: 'Bluesky Feed',

	canHaveLabel: true,

	keywords: ['bsky', 'atproto', 'feed', 'timeline', 'posts'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4"><path d="M6.335 3.836a47.2 47.2 0 0 1 5.354 4.94c.088.093.165.18.232.26a18 18 0 0 1 .232-.26 47.2 47.2 0 0 1 5.355-4.94C18.882 2.687 21.46 1.37 22.553 2.483c.986 1.003.616 4.264.305 5.857-.567 2.902-2.018 4.274-3.703 4.542 2.348.386 4.678 1.96 3.13 5.602-1.97 4.636-7.065 1.763-9.795-.418a3 3 0 0 1-.18-.15 3 3 0 0 1-.18.15c-2.73 2.18-7.825 5.054-9.795.418-1.548-3.643.782-5.216 3.13-5.602C3.98 12.631 2.529 11.26 1.962 8.357c-.311-1.593-.681-4.854.305-5.857C3.361 1.37 5.94 2.687 6.335 3.836Z" /></svg>`
} as CardDefinition & { type: 'blueskyFeed' };
