import type { Component } from 'svelte';
import type { Item } from '$lib/types';

export type CreationModalComponentProps = {
	item: Item;
	oncreate: () => void;
	oncancel: () => void;
};

export type SettingsModalComponentProps = {
	item: Item;
	onsave: (item: Item) => void;
	oncancel: () => void;
};

export type SidebarComponentProps = {
	onclick: () => void;
};

export type ContentComponentProps = {
	item: Item;
};

export type CardDefinition = {
	type: string; // should be unique
	contentComponent: Component<ContentComponentProps>; // content of card
	editingContentComponent?: Component<ContentComponentProps>; // optional content of card in editing mode

	createNew?: (item: Item) => void; // set some custom cardData stuff here (or custom default sizes)

	creationModalComponent?: Component<CreationModalComponentProps>;

	upload?: (item: Item) => Promise<Item>; // optionally upload some other data needed for this card

	// one of those two has to be set for a card to appear in the sidebar
	sidebarComponent?: Component<SidebarComponentProps>;
	sidebarButtonText?: string;

	// if this component exists, a settings button with a popover will be shown containing this component
	settingsComponent?: Component<ContentComponentProps>;

	// optionally load some extra data
	loadData?: (
		items: Item[],
		{ did, handle, platform }: { did: string; handle: string; platform?: App.Platform }
	) => Promise<unknown>;

	// show color selection popup
	allowSetColor?: boolean;

	// default card background color one of 'base', 'accent', 'transparent', or one of the tailwind colors
	// (actual colors only, without 'gray', 'neutral', 'stone', etc)
	defaultColor?: string;

	// for resizing:
	minW?: number;
	maxW?: number;

	minH?: number;
	maxH?: number;

	canResize?: boolean;
};