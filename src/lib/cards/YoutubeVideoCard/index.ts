import type { CardDefinition } from '../types';
import YoutubeCard from './YoutubeCard.svelte';
import YoutubeCardSettings from './YoutubeCardSettings.svelte';

export const YoutubeCardDefinition = {
	type: 'youtubeVideo',
	contentComponent: YoutubeCard,
	settingsComponent: YoutubeCardSettings,
	createNew: (card) => {
		card.cardType = 'youtubeVideo';
		card.cardData = {};
		card.w = 4;
		card.mobileW = 8;
	},

	onUrlHandler: (url, item) => {
		const id = matcher(url);
		if (!id) return;

		const posterFile = 'hqdefault';
		const posterURL = `https://i.ytimg.com/vi/${id}/${posterFile}.jpg`;

		item.cardData.poster = posterURL;
		item.cardData.youtubeId = id;
		item.cardData.href = url;
		item.cardData.showInline = true;

		item.w = 4;
		item.mobileW = 8;
		item.h = 3;
		item.mobileH = 5;

		return item;
	},
	urlHandlerPriority: 2,

	canChange: (item) => Boolean(matcher(item.cardData.href)),

	change: (item) => {
		const href = item.cardData?.href;

		const id = matcher(href);
		if (!id) return;

		const posterFile = 'hqdefault';
		const posterURL = `https://i.ytimg.com/vi/${id}/${posterFile}.jpg`;

		item.cardData.poster = posterURL;
		item.cardData.youtubeId = id;
		item.cardData.showInline ??= true;

		return item;
	},
	name: 'Youtube Video'
} as CardDefinition & { type: 'youtubeVideo' };

// Thanks to eleventy-plugin-youtube-embed
// https://github.com/gfscott/eleventy-plugin-youtube-embed/blob/main/lib/extractMatches.js
const urlPattern =
	/(?=(\s*))\1(?:<a [^>]*?>)??(?=(\s*))\2(?:https?:\/\/)??(?:w{3}\.)??(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/)??([A-Za-z0-9-_]{11})(?:[^\s<>]*)(?=(\s*))\4(?:<\/a>)??(?=(\s*))\5/;

/**
 * Extract a YouTube ID from a URL if it matches the pattern.
 * @param url URL to test
 * @returns A YouTube video ID or undefined if none matched
 */
export function matcher(url: string | undefined): string | undefined {
	if (!url) return;

	const match = url.match(urlPattern);
	return match?.[3];
}
