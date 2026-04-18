import type { Blob } from '@atcute/lexicons';
import type { AppBskyActorDefs } from '@atcute/bluesky';

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

	sectionId?: string;

	rotation?: number;
};

export type PronounSet = {
	forms: string[];
};

export type PronounsRecord = {
	value?: {
		sets?: PronounSet[];
		displayMode?: string;
		createdAt?: string;
		updatedAt?: string;
	};
};

export type SectionRecord = {
	id: string;
	sectionType: string;
	page: string;
	index: number;
	sectionData: Record<string, any>;
	name?: string;
	updatedAt?: string;
	version?: number;
};

export type WebsiteData = {
	page: string;
	did: string;
	handle: string;

	cards: Item[];
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

			// explicit layout sync mode (overrides editedOn when set)
			layoutMode?: 'desktop-leads' | 'mobile-leads' | 'independent';
		};
	};
	profile: AppBskyActorDefs.ProfileViewDetailed;
	pronouns?: string;
	pronounsRecord?: PronounsRecord;

	sections: SectionRecord[];

	additionalData: Record<string, unknown>;
	updatedAt: number;
	version?: number;

	/** Set by checkData when overlapping cards are detected before fixing. */
	hasLayoutIssue?: boolean;
};
