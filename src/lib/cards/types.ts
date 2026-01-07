import type { Component } from 'svelte';
import type { Item } from '$lib/types';

export type CreationModalComponentProps = {
	item: Item;
	oncreate: () => void;
	oncancel: () => void;
};

export type SettingsModalComponentProps = {
	item: Item;
	onSave: (item: Item) => void;
	onCancel: () => void;
};

export type SidebarComponentProps = {
	onclick: () => void;
};

export type ContentComponentProps = {
	item: Item;
};

export type CardDefinition = {
	contentComponent: Component<ContentComponentProps>;
	editingContentComponent?: Component<ContentComponentProps>;

	createNew?: (item: Item) => void;
	creationModalComponent?: Component<CreationModalComponentProps>;
	settingsModalComponent?: Component<{
		item: Item;
		onSave: (item: Item) => void;
		onCancel: () => void;
	}>;

	upload?: (item: Item) => Promise<Item>;

	sidebarComponent?: Component<SidebarComponentProps>;
};
