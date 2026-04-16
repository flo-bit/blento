import { COLUMNS } from '$lib';
import { checkAndUploadImage } from '$lib/helper';
import type { CardDefinition } from '../../types';
import EditingHeroCard from './EditingHeroCard.svelte';
import HeroCard from './HeroCard.svelte';
import HeroCardSettings from './HeroCardSettings.svelte';

export type HeroDecoration = {
	id: string;
	side: 'left' | 'right';
	top: number;
	rotation: number;
	image?: any;
	title?: string;
	subtitle?: string;
};

export const DEFAULT_DECORATION_SLOTS: HeroDecoration[] = [
	{ id: 'slot-l-0', side: 'left', top: 8, rotation: -10 },
	{ id: 'slot-l-1', side: 'left', top: 32, rotation: -4 },
	{ id: 'slot-l-2', side: 'left', top: 58, rotation: -12 },
	{ id: 'slot-l-3', side: 'left', top: 80, rotation: -6 },
	{ id: 'slot-r-0', side: 'right', top: 10, rotation: 8 },
	{ id: 'slot-r-1', side: 'right', top: 34, rotation: 12 },
	{ id: 'slot-r-2', side: 'right', top: 60, rotation: 5 },
	{ id: 'slot-r-3', side: 'right', top: 82, rotation: 11 }
];

export function getHeroDecorations(cardData: Record<string, any>): HeroDecoration[] {
	const stored = (cardData.decorations as HeroDecoration[]) ?? [];
	return DEFAULT_DECORATION_SLOTS.map((slot) => {
		const found = stored.find((d) => d.id === slot.id);
		return found ? { ...slot, ...found } : slot;
	});
}

export const HeroCardDefinition = {
	type: 'hero',
	contentComponent: HeroCard,
	editingContentComponent: EditingHeroCard,
	settingsComponent: HeroCardSettings,
	upload: async (item) => {
		const decorations = (item.cardData.decorations as HeroDecoration[]) ?? [];
		for (const decoration of decorations) {
			await checkAndUploadImage(decoration as Record<string, any>, 'image');
		}
		return item;
	},
	createNew: (card) => {
		card.cardType = 'hero';
		card.cardData = {
			title: 'My cool website',
			subtitle: 'A little something about me, what I do, and why you should stick around.',
			badge: 'Welcome',
			buttonText: 'Say hi',
			buttonHref: '',
			showBadge: true,
			showSubtitle: true,
			showButton: true,
			textAlign: 'center',
			verticalAlign: 'center',
			decorations: []
		};

		card.w = COLUMNS;
		card.h = 7;
		card.mobileW = COLUMNS;
		card.mobileH = 10;
	},

	defaultColor: 'transparent',
	allowSetColor: true,
	canHaveLabel: false,
	noOverflow: true,

	minW: COLUMNS,
	minH: 4,
	maxW: COLUMNS,
	maxH: 16,

	name: 'Hero',
	keywords: ['hero', 'header', 'landing', 'banner', 'intro', 'title', 'cta'],
	groups: ['Sections'],

	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 10h10"/><path d="M7 14h6"/></svg>`
} as CardDefinition & { type: 'hero' };

export const heroAlignClasses: Record<string, string> = {
	left: 'text-left items-start',
	center: 'text-center items-center',
	right: 'text-right items-end'
};

export const heroVerticalAlignClasses: Record<string, string> = {
	top: 'justify-start',
	center: 'justify-center',
	bottom: 'justify-end'
};
