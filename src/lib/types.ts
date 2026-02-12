import type { Blob } from '@atcute/lexicons';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { Sticker } from '$lib/stickers/types';

export type Item = {
	id: string;

	w: number;
	h: number;
	x: number;
	y: number;

	mobileW: number;
	mobileH: number;
	mobileX: number;
	mobileY: number;

	cardType: string;

	color?: string;

	cardData: any;

	updatedAt?: string;

	version?: number;

	page?: string;
};

export type WebsiteData = {
	page: string;
	did: string;
	handle: string;

	cards: Item[];
	stickers: Sticker[];
	publication: {
		url?: string;
		name?: string;
		description?: string;
		icon?: Blob;
		preferences?: {
			/**
			 * @deprecated
			 *
			 * use hideProfileSection instead
			 */
			hideProfile?: boolean;

			// use this instead
			hideProfileSection?: boolean;

			// 'side' (default on desktop) or 'top' (always top like mobile view)
			profilePosition?: 'side' | 'top';

			// theme colors
			accentColor?: string;
			baseColor?: string;

			// layout mirroring: 0/undefined=never edited, 1=desktop only, 2=mobile only, 3=both
			editedOn?: number;
		};
	};
	profile: AppBskyActorDefs.ProfileViewDetailed;

	additionalData: Record<string, unknown>;
	updatedAt: number;
	version?: number;
};
