import type { Item } from '$lib/types';

export type DecorationSlot = {
	id: string;
	side: 'left' | 'right';
	top: number;
	rotation: number;
};

export const DEFAULT_DECORATION_SLOTS: DecorationSlot[] = [
	{ id: 'slot-l-0', side: 'left', top: 15, rotation: -10 },
	{ id: 'slot-l-1', side: 'left', top: 50, rotation: -4 },
	{ id: 'slot-l-2', side: 'left', top: 82, rotation: -12 },
	{ id: 'slot-r-0', side: 'right', top: 18, rotation: 8 },
	{ id: 'slot-r-1', side: 'right', top: 52, rotation: -12 },
	{ id: 'slot-r-2', side: 'right', top: 80, rotation: 6 }
];

export function getSlotAssignments(sectionData: Record<string, any>): Record<string, string> {
	return (sectionData.slotAssignments as Record<string, string>) ?? {};
}

export function getSlotItem(
	slot: DecorationSlot,
	assignments: Record<string, string>,
	items: Item[]
): Item | undefined {
	const itemId = assignments[slot.id];
	if (!itemId) return undefined;
	return items.find((i) => i.id === itemId);
}

export function canFitInSlot(cardDef: { minW?: number; minH?: number }): boolean {
	return (cardDef.minW ?? 2) <= 2 && (cardDef.minH ?? 2) <= 2;
}

export function defaultHeroSectionData(): Record<string, any> {
	return {
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
		slotAssignments: {}
	};
}

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
