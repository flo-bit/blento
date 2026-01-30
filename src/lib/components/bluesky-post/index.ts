import type { PostData, PostEmbed } from '../post';
import type { PostView } from '@atcute/bluesky/types/app/feed/defs';
import { segmentize, type Facet, type RichtextSegment } from '@atcute/bluesky-richtext-segmenter';

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

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
	console.log(JSON.parse(JSON.stringify(data)));

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
					// Cast to any to handle union type - properties are conditionally accessed
					images: (post.embed as any)?.images?.map((image: any) => ({
						alt: image.alt,
						thumb: image.thumb,
						aspectRatio: image.aspectRatio,
						fullsize: image.fullsize
					})),
					external: (post.embed as any)?.external
						? {
								href: (post.embed as any).external.uri,
								title: (post.embed as any).external.title,
								description: (post.embed as any).external.description,
								thumb: (post.embed as any).external.thumb
							}
						: undefined,
					video: (post.embed as any)?.playlist
						? {
								playlist: (post.embed as any).playlist,
								thumb: (post.embed as any).thumbnail,
								alt: (post.embed as any).alt,
								aspectRatio: (post.embed as any).aspectRatio
							}
						: undefined
				} as PostEmbed)
			: undefined,

		htmlContent: blueskyPostToHTML(post, baseUrl),
		labels: post.labels ? post.labels.map((label) => label.val) : undefined
	};
}

interface MentionFeature {
	$type: 'app.bsky.richtext.facet#mention';
	did: string;
}

interface LinkFeature {
	$type: 'app.bsky.richtext.facet#link';
	uri: string;
}

interface TagFeature {
	$type: 'app.bsky.richtext.facet#tag';
	tag: string;
}

type Feature = MentionFeature | LinkFeature | TagFeature;

const renderSegment = (segment: RichtextSegment, baseUrl: string) => {
	const { text, features } = segment;
	const escaped = escapeHtml(text);

	if (!features) {
		return `<span>${escaped}</span>`;
	}

	// segments can have multiple features, use the first one
	const feature = features[0] as Feature;

	const createLink = (href: string, text: string) => {
		return `<a target="_blank" rel="noopener noreferrer nofollow" href="${encodeURI(href)}">${text}</a>`;
	};

	switch (feature.$type) {
		case 'app.bsky.richtext.facet#mention':
			return createLink(`${baseUrl}/profile/${feature.did}`, escaped);
		case 'app.bsky.richtext.facet#link':
			return createLink(feature.uri, escaped);
		case 'app.bsky.richtext.facet#tag':
			return createLink(`${baseUrl}/hashtag/${feature.tag}`, escaped);
		default:
			return `<span>${escaped}</span>`;
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

	const html = RichText(
		{ text: post.record.text as string, facets: post.record.facets as Facet[] },
		baseUrl
	);

	return html.replace(/\n/g, '<br>');
}

export { default as BlueskyPost } from './BlueskyPost.svelte';
