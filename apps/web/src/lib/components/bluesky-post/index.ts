import type { PostData, PostEmbed, QuotedPostData } from '../post';
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
		case 'app.bsky.embed.record#view':
		case 'app.bsky.embed.record':
			return 'record';
		case 'app.bsky.embed.recordWithMedia#view':
		case 'app.bsky.embed.recordWithMedia':
			return 'recordWithMedia';
		default:
			return 'unknown';
	}
}

function extractQuotedPost(recordView: any, baseUrl: string): QuotedPostData | null {
	if (!recordView?.author) return null;

	const id = recordView.uri?.split('/').pop();
	const author = recordView.author;
	const value = recordView.value as any;

	let htmlContent = '';
	if (value?.text) {
		htmlContent = RichText({ text: value.text, facets: value.facets }, baseUrl).replace(
			/\n/g,
			'<br>'
		);
	}

	// Convert nested media embeds (skip record embeds to avoid recursion)
	let embed: PostEmbed | undefined;
	const firstEmbed = recordView.embeds?.[0] as any;
	if (firstEmbed) {
		const embedType = blueskyEmbedTypeToEmbedType(firstEmbed.$type);
		if (embedType !== 'record' && embedType !== 'recordWithMedia' && embedType !== 'unknown') {
			embed = convertEmbed(firstEmbed, baseUrl);
		}
	}

	return {
		author: {
			displayName: author.displayName || '',
			handle: author.handle,
			avatar: author.avatar,
			href: `${baseUrl}/profile/${author.did}`
		},
		href: `${baseUrl}/profile/${author.handle}/post/${id}`,
		htmlContent,
		createdAt: value?.createdAt,
		embed
	};
}

function convertEmbed(embedView: any, baseUrl: string): PostEmbed {
	const type = blueskyEmbedTypeToEmbedType(embedView?.$type);

	switch (type) {
		case 'images':
			return {
				type: 'images',
				images: embedView.images?.map((image: any) => ({
					alt: image.alt,
					thumb: image.thumb,
					aspectRatio: image.aspectRatio,
					fullsize: image.fullsize
				}))
			};
		case 'external':
			return embedView.external
				? {
						type: 'external',
						external: {
							href: embedView.external.uri,
							title: embedView.external.title,
							description: embedView.external.description,
							thumb: embedView.external.thumb
						}
					}
				: { type: 'unknown' };
		case 'video':
			return embedView.playlist
				? {
						type: 'video',
						video: {
							playlist: embedView.playlist,
							thumb: embedView.thumbnail,
							alt: embedView.alt,
							aspectRatio: embedView.aspectRatio
						}
					}
				: { type: 'unknown' };
		case 'record': {
			const record = extractQuotedPost(embedView.record, baseUrl);
			return record ? { type: 'record', record } : { type: 'unknown' };
		}
		case 'recordWithMedia': {
			const record = extractQuotedPost(embedView.record?.record, baseUrl);
			const media = embedView.media ? convertEmbed(embedView.media, baseUrl) : undefined;
			if (record) {
				return {
					type: 'recordWithMedia',
					record,
					media: media ?? { type: 'unknown' }
				};
			}
			return media ?? { type: 'unknown' };
		}
		default:
			return { type: 'unknown' };
	}
}

export function blueskyPostToPostData(
	data: PostView,
	baseUrl: string = 'https://bsky.app'
): PostData {
	const post = data;
	const id = post.uri.split('/').pop();

	return {
		id,
		href: `${baseUrl}/profile/${post.author.handle}/post/${id}`,
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

		embed: post.embed ? convertEmbed(post.embed, baseUrl) : undefined,

		htmlContent: blueskyPostToHTML(post, baseUrl),
		labels: post.labels ? post.labels.map((label) => label.val) : undefined
	};
}

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
