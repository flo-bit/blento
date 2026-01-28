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
	sidebarButtonText: 'Bluesky Post',
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
	name: 'Bluesky Post'
} as CardDefinition & { type: 'blueskyPost' };
