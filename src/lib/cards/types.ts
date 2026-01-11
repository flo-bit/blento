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
	type: string;
	contentComponent: Component<ContentComponentProps>;
	editingContentComponent?: Component<ContentComponentProps>;

	createNew?: (item: Item) => void;

	creationModalComponent?: Component<CreationModalComponentProps>;

	settingsModalComponent?: Component<SettingsModalComponentProps>;

	upload?: (item: Item) => Promise<Item>;

	sidebarComponent?: Component<SidebarComponentProps>;
	sidebarButtonText?: string;

	loadData?: (
		items: Item[],
		{ did, handle, platform }: { did: string; handle: string; platform?: App.Platform }
	) => Promise<unknown>;
	dataKey?: string;

	allowSetColor?: boolean;

	defaultColor?: string;

	minW?: number;
	maxW?: number;

	minH?: number;
	maxH?: number;
};
