import { matcher } from '$lib/cards/media/YoutubeVideoCard/index';
import YouTubeEmbed from './YouTubeEmbed.svelte';
import type { EmbedDefinition } from './types';

export const youtubeEmbed: EmbedDefinition = {
	type: 'youtube',
	match: (url: string) => {
		const id = matcher(url);
		if (!id) return null;
		return {
			videoId: id,
			poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
		};
	},
	component: YouTubeEmbed
};
