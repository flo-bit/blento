export type PostEmbedImage = {
	type: 'images';

	images: {
		alt: string;
		thumb: string;
		fullsize: string;
		aspectRatio?: {
			width: number;
			height: number;
		};
	}[];
};

export type PostEmbedExternal = {
	type: 'external';

	external: {
		href: string;
		thumb: string;
		title: string;
		description: string;
	};
};

export type PostEmbedVideo = {
	type: 'video';

	video: {
		playlist: string;

		thumb: string;
		alt: string;

		aspectRatio?: {
			width: number;
			height: number;
		};
	};
};

export type QuotedPostData = {
	author: {
		displayName: string;
		handle: string;
		avatar?: string;
		href?: string;
	};
	href?: string;
	htmlContent?: string;
	createdAt?: string;
	embed?: PostEmbed;
};

export type PostEmbedRecord = {
	type: 'record';
	record: QuotedPostData;
};

export type PostEmbedRecordWithMedia = {
	type: 'recordWithMedia';
	record: QuotedPostData;
	media: PostEmbed;
};

export type UnknownEmbed = {
	type: 'unknown';
} & Record<string, unknown>;

export type PostEmbed =
	| PostEmbedImage
	| PostEmbedExternal
	| PostEmbedVideo
	| PostEmbedRecord
	| PostEmbedRecordWithMedia
	| UnknownEmbed;

export type PostData = {
	href?: string;
	id?: string;

	reposted?: { handle: string; href: string };
	replyTo?: { handle: string; href: string };

	author: {
		displayName: string;
		handle: string;
		avatar?: string;
		href?: string;
	};

	replyCount: number;
	repostCount: number;
	likeCount: number;

	createdAt: string;

	embed?: PostEmbed;

	htmlContent?: string;

	replies?: PostData[];

	labels?: string[];
};

export const nsfwLabels = ['porn', 'sexual', 'graphic-media', 'nudity'];

export function hasNSFWLabel(post: PostData): boolean {
	if (!post.labels) return false;

	return post.labels.some((label) => nsfwLabels.includes(label));
}

export { default as Post } from './Post.svelte';
