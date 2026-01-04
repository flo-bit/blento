import type { Component } from 'svelte';
import type { BaseCardProps } from './BaseCard/BaseCard.svelte';
import type { Item } from '$lib/types';
import type { BaseEditingCardProps } from './BaseCard/BaseEditingCard.svelte';

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

export type CardDefinition = {
	cardComponent: Component<BaseCardProps>;
	editingCardComponent: Component<BaseEditingCardProps>;
	createNew?: (item: Item) => void;
	creationModalComponent?: Component<CreationModalComponentProps>;
	settingsModalComponent?: Component<{
		item: Item;
		onSave: (item: Item) => void;
		onCancel: () => void;
	}>;
};
