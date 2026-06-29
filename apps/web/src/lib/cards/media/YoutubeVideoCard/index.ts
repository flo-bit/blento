import type { CardDefinition } from '../../types';
import CreateYoutubeCardModal from './CreateYoutubeCardModal.svelte';
import YoutubeCard from './YoutubeCard.svelte';
import YoutubeCardSettings from './YoutubeCardSettings.svelte';

export const YoutubeCardDefinition = {
	type: 'youtubeVideo',
	contentComponent: YoutubeCard,
	settingsComponent: YoutubeCardSettings,
	creationModalComponent: CreateYoutubeCardModal,
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
	name: 'Youtube Video',

	keywords: ['video', 'yt', 'stream', 'watch'],
	groups: ['Media'],

	icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-3" viewBox="0 0 256 180"
			><path
				fill="currentColor"
				d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134"
			/><path fill="currentColor" class="invert" d="m102.421 128.06l66.328-38.418l-66.328-38.418z" /></svg
		>`
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
