import type { CardDefinition } from '../types';
import BlueskyPostCard from './BlueskyPostCard.svelte';
import CreateBlueskyPostCardModal from './CreateBlueskyPostCardModal.svelte';
import { getPosts } from '$lib/atproto/methods';
import type { PostView } from '@atcute/bluesky/types/app/feed/defs';
import { parseBlueskyPostUrl, resolveUri } from './utils';

export const BlueskyPostCardDefinition = {
	type: 'blueskyPost',
	contentComponent: BlueskyPostCard,
	creationModalComponent: CreateBlueskyPostCardModal,
	createNew: (card) => {
		card.cardType = 'blueskyPost';
		card.w = 4;
		card.mobileW = 8;
		card.h = 4;
		card.mobileH = 8;
	},

	onUrlHandler: (url, item) => {
		const parsed = parseBlueskyPostUrl(url);
		if (!parsed) return null;

		// Construct AT URI using handle (will be resolved to DID when loading)
		item.cardData.uri = `at://${parsed.handle}/app.bsky.feed.post/${parsed.rkey}`;
		item.cardData.href = url;

		item.w = 4;
		item.mobileW = 8;
		item.h = 4;
		item.mobileH = 8;

		return item;
	},
	urlHandlerPriority: 2,

	loadData: async (items) => {
		// Collect all unique URIs from blueskyPost cards
		const originalUris = items
			.filter((item) => item.cardData?.uri)
			.map((item) => item.cardData.uri as string);

		if (originalUris.length === 0) return {};

		// Resolve handles to DIDs
		const resolvedUris = await Promise.all(originalUris.map(resolveUri));

		const posts = await getPosts({ uris: resolvedUris });
		if (!posts) return {};

		// Create a map of URI -> PostView (keyed by both original and resolved URIs)
		const postsMap: Record<string, PostView> = {};
		for (let i = 0; i < posts.length; i++) {
			const post = posts[i];
			postsMap[post.uri] = post;
			// Also map by original URI for lookup
			if (originalUris[i] && originalUris[i] !== post.uri) {
				postsMap[originalUris[i]] = post;
			}
		}

		return postsMap;
	},
	minW: 4,
	name: 'Bluesky Post',

	canHaveLabel: true,

	keywords: ['skeet', 'bsky', 'atproto', 'post'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>`
} as CardDefinition & { type: 'blueskyPost' };
