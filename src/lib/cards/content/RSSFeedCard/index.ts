import type { CardDefinition } from '../../types';
import RSSFeedSettings from './RSSFeedSettings.svelte';
import RSSFeedCard from './RSSFeedCard.svelte';
import { fetchRssFeed } from './api.remote';
import { normalizeFeedUrl } from './util';
import type { RssFeedItem } from './types';

const cardType = 'rssFeed';


export const RSSFeedCardDefinition = {
	type: cardType,
	contentComponent: RSSFeedCard,
	source: {
		label: 'Feed URL',
		placeholder: 'https://example.com/feed.xml',
		errorMessage: "That doesn't look like a valid RSS feed URL",
		currentUrl: (item) => (item.cardData.href as string | undefined) ?? '',
		apply: (url, item) => {
			const feedUrl = normalizeFeedUrl(url);
			if (!feedUrl) return false;

			item.cardData.href = feedUrl;
			item.w = 4;
			item.h = 6;
			item.mobileW = 8;
			item.mobileH = 10;
			return true;
		}
	},
	createNew: (card) => {
		card.cardType = cardType;
		card.cardData = {
			title: '',
			itemCount: 5,
			showDescription: true
		};
		card.w = 4;
		card.h = 6;
		card.mobileW = 8;
		card.mobileH = 10;
	},
	onUrlHandler: (url, item) => {
		const feedUrl = normalizeFeedUrl(url);
		if (!feedUrl) return null;

		const parsed = new URL(feedUrl);
		const looksLikeFeed = /(?:^|\/)(?:feed|feeds|rss|atom)(?:[/?#]|$)|\.(?:rss|xml|atom)(?:[?#]|$)/i.test(
			`${parsed.pathname}${parsed.search}${parsed.hash}`
		);
		if (!looksLikeFeed) return null;

		item.cardData.href = feedUrl;
		item.w = 4;
		item.h = 6;
		item.mobileW = 8;
		item.mobileH = 10;

		return item;
	},
	urlHandlerPriority: 1,
	settingsComponent: RSSFeedSettings,

	loadData: async (items) => {
		const feedsByUrl: Record<string, RssFeedItem[]> = {};
		const uniqueUrls = new Set<string>();

		for (const item of items) {
			const href = item.cardData.href as string | undefined;
			const normalized = href ? normalizeFeedUrl(href) : undefined;
			if (normalized) uniqueUrls.add(normalized);
		}

		await Promise.all(
			[...uniqueUrls].map(async (feedUrl) => {
				feedsByUrl[feedUrl] = await fetchRssFeed(feedUrl);
			})
		);

		return feedsByUrl;
	},

	name: 'RSS Feed',
	canHaveLabel: true,

	// Server-side loader to preload feeds during SSR (avoids client refresh and CORS issues)
	loadDataServer: async (items) => {
		const feedsByUrl: Record<string, RssFeedItem[]> = {};
		const uniqueUrls = new Set<string>();

		for (const item of items) {
			const href = item.cardData.href as string | undefined;
			const normalized = href ? normalizeFeedUrl(href) : undefined;
			if (normalized) uniqueUrls.add(normalized);
		}

		await Promise.all(
			[...uniqueUrls].map(async (feedUrl) => {
				try {
					feedsByUrl[feedUrl] = await fetchRssFeed(feedUrl);
				} catch {
					feedsByUrl[feedUrl] = [];
				}
			})
		);

		return feedsByUrl;
	},

	keywords: ['rss', 'feed', 'atom', 'blog', 'posts', 'podcast'],
	groups: ['Content'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4"><path d="M6.5 17.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="currentColor"/><path d="M4 11a9 9 0 0 1 9 9" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 6a14 14 0 0 1 14 14" stroke-linecap="round" stroke-linejoin="round"/></svg>`
} as CardDefinition & { type: typeof cardType };