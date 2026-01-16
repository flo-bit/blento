import type { At } from '@atcute/client/lexicons';
import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';

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

	hideOnMobile?: boolean;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	publication:
		| {
				url?: string;
				name?: string;
				description?: string;
				icon?: At.Blob;
				preferences?: {
					hideProfile?: boolean;
				};
		  }
		| undefined;
	profile: ProfileViewDetailed;

	additionalData: Record<string, unknown>;
	updatedAt: number;
	version?: number;
};

export type UserCache = {
	get: (key: string) => string;
	put: (key: string, value: string) => void;
};
