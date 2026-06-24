import { query, getRequestEvent } from '$app/server';
import { XMLParser } from 'fast-xml-parser';
import { createCache } from '$lib/helpers/cache';
import type { RssFeedItem } from './types';
import { normalizeFeedUrl } from './util';

const xmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
	removeNSPrefix: true,
	parseTagValue: true,
	trimValues: true,
	processEntities: true
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
	if (value == null) return [];
	return Array.isArray(value) ? value : [value];
}

function firstString(...values: unknown[]): string | undefined {
	for (const value of values) {
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
	return undefined;
}

function stripHtml(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const stripped = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
	return stripped || undefined;
}

// normalizeFeedUrl is provided by ./util and should not be exported from a remote module

function resolveUrl(url: string | undefined, baseUrl: string): string | undefined {
	if (!url) return undefined;
	try {
		return new URL(url, baseUrl).toString();
	} catch {
		return undefined;
	}
}

function readLink(entry: Record<string, unknown>, baseUrl: string): string | undefined {
	const link = entry.link;
	const candidates = Array.isArray(link) ? link : [link];

	for (const candidate of candidates) {
		if (typeof candidate === 'string') {
			const resolved = resolveUrl(candidate, baseUrl);
			if (resolved) return resolved;
			continue;
		}

		if (!candidate || typeof candidate !== 'object') continue;
		const typedCandidate = candidate as Record<string, unknown>;
		const rel = firstString(typedCandidate.rel);
		if (rel && rel !== 'alternate') continue;
		const href = firstString(typedCandidate.href, typedCandidate.url);
		const resolved = resolveUrl(href, baseUrl);
		if (resolved) return resolved;
	}

	return undefined;
}

function readDate(entry: Record<string, unknown>): string {
	return firstString(entry.pubDate, entry.published, entry.updated, entry.date, entry.issued) ?? '';
}

function readDescription(entry: Record<string, unknown>): string | undefined {
	return stripHtml(
		firstString(
			entry.description,
			entry.summary,
			entry.content,
			entry['content:encoded'],
			entry['encoded'],
			entry.contentSnippet,
			entry.subtitle
		)
	);
}

function parseFeedItems(feedUrl: string, xml: string): RssFeedItem[] {
	const parsed = xmlParser.parse(xml) as Record<string, any>;
	const root = parsed.rss?.channel ?? parsed.feed ?? parsed.channel ?? parsed;
	const entries = asArray(root.item ?? root.entry);

	const itemsByHref = new Map<string, RssFeedItem>();

	for (const entry of entries) {
		if (!entry || typeof entry !== 'object') continue;
		const typedEntry = entry as Record<string, unknown>;
		const href = readLink(typedEntry, feedUrl);
		const title = firstString(typedEntry.title, typedEntry.name);
		if (!href || !title) continue;

		const candidate: RssFeedItem = {
			href,
			title,
			description: readDescription(typedEntry),
			date: readDate(typedEntry)
		};

		const existing = itemsByHref.get(href);
		const candidateTime = candidate.date ? Date.parse(candidate.date) : 0;
		const existingTime = existing?.date ? Date.parse(existing.date) : 0;
		if (!existing || candidateTime >= existingTime) {
			itemsByHref.set(href, candidate);
		}
	}

	return [...itemsByHref.values()].toSorted((a, b) => {
		const aTime = a.date ? Date.parse(a.date) : 0;
		const bTime = b.date ? Date.parse(b.date) : 0;
		return bTime - aTime;
	});
}

async function loadFeed(feedUrl: string): Promise<RssFeedItem[]> {
	const { platform } = getRequestEvent();
	const cache = createCache(platform);

	const cached = await cache?.getJSON<RssFeedItem[]>('rss', feedUrl);
	if (cached) return cached;

	const response = await fetch(feedUrl, {
		headers: {
			accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
		}
	});
	if (!response.ok) return [];

	const xml = await response.text();
	const items = parseFeedItems(feedUrl, xml);

	await cache?.putJSON('rss', feedUrl, items);
	return items;
}

export const fetchRssFeed = query('unchecked', async (feedUrl: string) => {
	const normalized = normalizeFeedUrl(feedUrl);
	if (!normalized) return [];

	return await loadFeed(normalized);
});