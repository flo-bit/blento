import type { Component } from 'svelte';
import type { Item, SectionRecord } from '$lib/types';
import type { CardDefinition } from '$lib/cards/types';

export type SectionContentProps = {
	section: SectionRecord;
	items: Item[];
	isMobile: boolean;
};

export type EditingSectionContentProps = SectionContentProps & {
	selectedCardId: string | null;
	isCoarse: boolean;
	isActive: boolean;
	onlayoutchange: () => void;
	ondeselect: () => void;
	onrequestaddcard: (extraData?: Record<string, any>) => void;
	oncreatefilecards: (files: File[]) => Promise<Item[]>;
	onactivate: () => void;
	onrefchange: (el: HTMLDivElement | undefined) => void;
};

export type AddItemOptions = {
	gridRef?: HTMLDivElement;
	isMobile: boolean;
	extraData?: Record<string, any>;
};

export type SectionDefinition = {
	type: string;
	contentComponent: Component<SectionContentProps>;
	editingContentComponent: Component<EditingSectionContentProps>;
	defaultSectionData?: () => Record<string, any>;
	cardFilter?: (cardDef: CardDefinition) => boolean;
	addItem: (item: Item, allItems: Item[], options: AddItemOptions) => Item[];
	deleteItem: (itemId: string, allItems: Item[], sectionId: string) => Item[];
	resizeItem: (item: Item, allItems: Item[], w: number, h: number, isMobile: boolean) => void;
	name: string;
	icon?: string;
};
