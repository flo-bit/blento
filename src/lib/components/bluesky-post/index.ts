import type { PostData, PostEmbed } from '../post';
import type { PostView } from '@atcute/bluesky/types/app/feed/defs';
import { segmentize, type Facet, type RichtextSegment } from '@atcute/bluesky-richtext-segmenter';

function blueskyEmbedTypeToEmbedType(type: string) {
	switch (type) {
		case 'app.bsky.embed.external#view':
		case 'app.bsky.embed.external':
			return 'external';
		case 'app.bsky.embed.images#view':
		case 'app.bsky.embed.images':
			return 'images';
		case 'app.bsky.embed.video#view':
		case 'app.bsky.embed.video':
			return 'video';
		default:
			return 'unknown';
	}
}

export function blueskyPostToPostData(
	data: PostView,
	baseUrl: string = 'https://bsky.app'
): PostData {
	const post = data;
	// const reason = data.reason;
	// const reply = data.reply?.parent;
	// const replyId = reply?.uri?.split('/').pop();

	const id = post.uri.split('/').pop();

	return {
		id,
		href: `${baseUrl}/profile/${post.author.handle}/post/${id}`,
		// reposted:
		// 	reason && reason.$type === 'app.bsky.feed.defs#reasonRepost'
		// 		? {
		// 				handle: reason.by.handle,
		// 				href: `${baseUrl}/profile/${reason.by.handle}`
		// 			}
		// 		: undefined,

		// replyTo:
		// 	reply && replyId
		// 		? {
		// 				handle: reply.author.handle,
		// 				href: `${baseUrl}/profile/${reply.author.handle}/post/${replyId}`
		// 			}
		// 		: undefined,
		author: {
			displayName: post.author.displayName || '',
			handle: post.author.handle,
			avatar: post.author.avatar,
			href: `${baseUrl}/profile/${post.author.did}`
		},
		replyCount: post.replyCount ?? 0,
		repostCount: post.repostCount ?? 0,
		likeCount: post.likeCount ?? 0,
		createdAt: post.record.createdAt as string,

		embed: post.embed
			? ({
					type: blueskyEmbedTypeToEmbedType(post.embed?.$type),
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					images: post.embed?.images?.map((image: any) => ({
						alt: image.alt,
						thumb: image.thumb,
						aspectRatio: image.aspectRatio,
						fullsize: image.fullsize
					})),
					external: post.embed?.external
						? {
								href: post.embed.external.uri,
								title: post.embed.external.title,
								description: post.embed.external.description,
								thumb: post.embed.external.thumb
							}
						: undefined,
					video: post.embed
						? {
								playlist: post.embed.playlist,
								thumb: post.embed.thumbnail,
								alt: post.embed.alt,
								aspectRatio: post.embed.aspectRatio
							}
						: undefined
				} as PostEmbed)
			: undefined,

		htmlContent: blueskyPostToHTML(post, baseUrl)
	};
}

const renderSegment = (segment: RichtextSegment, baseUrl: string) => {
	const { text, features } = segment;

	if (!features) {
		return `<span>${text}</span>`;
	}

	// segments can have multiple features, use the first one
	const feature = features[0];

	const createLink = (href: string, text: string) => {
		return `<a target="_blank" rel="noopener noreferrer nofollow" href="${encodeURI(href)}">${text}</a>`;
	};

	switch (feature.$type) {
		case 'app.bsky.richtext.facet#mention':
			return createLink(`${baseUrl}/profile/${segment.handle}`, segment.text);
		case 'app.bsky.richtext.facet#link':
			return createLink(feature.uri, segment.text);
		case 'app.bsky.richtext.facet#tag':
			return createLink(`${baseUrl}/hashtag/${segment.tag}`, segment.text);
		default:
			return `<span>${text}</span>`;
	}
};

const RichText = ({ text, facets }: { text: string; facets?: Facet[] }, baseUrl: string) => {
	const segments = segmentize(text, facets);
	return segments.map((v) => renderSegment(v, baseUrl)).join('');
};

export function blueskyPostToHTML(post: PostView, baseUrl: string = 'https://bsky.app') {
	if (!post?.record) {
		return '';
	}

	const html = RichText({ text: post.record.text, facets: post.record.facets }, baseUrl);

	return html.replace(/\n/g, '<br>');
}

export { default as BlueskyPost } from './BlueskyPost.svelte';
