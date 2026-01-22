import { RichText } from '@atproto/api';
import type { PostData, PostEmbed } from '../post';
import type { PostView } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

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
			displayName: post.author.displayName,
			handle: post.author.handle,
			avatar: post.author.avatar,
			href: `${baseUrl}/profile/${post.author.did}`
		},
		replyCount: post.replyCount ?? 0,
		repostCount: post.repostCount ?? 0,
		likeCount: post.likeCount ?? 0,
		createdAt: post.record.createdAt ?? 0,

		embed: post.embed
			? ({
					type: blueskyEmbedTypeToEmbedType(post.embed?.$type),

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

export function blueskyPostToHTML(post: any, baseUrl: string = 'https://bsky.app') {
	if (!post?.record) {
		return '';
	}
	const rt = new RichText(post.record);
	let html = '';

	const createLink = (href: string, text: string) => {
		return `<a target="_blank" rel="noopener noreferrer nofollow" href="${encodeURI(href)}">${encodeURI(text)}</a>`;
	};

	for (const segment of rt.segments()) {
		if (!segment) continue;
		if (segment.isLink() && segment.link?.uri) {
			html += createLink(segment.link?.uri, segment.text);
		} else if (segment.isMention() && segment.mention?.did) {
			html += createLink(`${baseUrl}/profile/${segment.mention?.did}`, segment.text);
		} else if (segment.isTag() && segment.tag?.tag) {
			html += createLink(`${baseUrl}/hashtag/${segment.tag?.tag}`, segment.text);
		} else {
			html += segment.text;
		}
	}

	return html.replace(/\n/g, '<br>');
}

export { default as BlueskyPost } from './BlueskyPost.svelte';
