import type { Blob } from '@atcute/lexicons';

export type StickerType = 'emoji' | 'image';

export type Sticker = {
	id: string;
	type: StickerType;
	x: number; // center-relative horizontal offset (percentage * 100, integer)
	y: number; // from page top (percentage * 100, integer)
	rotation: number; // degrees, integer
	scale: number; // scale * 100 (100 = 1x)
	emoji?: string;
	image?: Blob | { blob: File; objectUrl: string };
	page?: string;
	updatedAt?: string;
};
