import type { Component } from 'svelte';
import type { Item } from '$lib/types';
import type { CacheService } from '$lib/cache';
import type { Did } from '@atcute/lexicons';

export type CreationModalComponentProps = {
	item: Item;
	oncreate: () => void;
	oncancel: () => void;
};

export type SettingsComponentProps = {
	item: Item;
	onclose: () => void;
};

export type ContentComponentProps = {
	item: Item;
	isEditing?: boolean;
};

export type CardDefinition = {
	type: string; // should be unique
	contentComponent: Component<ContentComponentProps>; // content of card
	editingContentComponent?: Component<ContentComponentProps>; // optional content of card in editing mode

	createNew?: (item: Item) => void; // set some custom cardData stuff here (or custom default sizes)

	creationModalComponent?: Component<CreationModalComponentProps>;

	upload?: (item: Item) => Promise<Item>; // optionally upload some other data needed for this card

	// if this component exists, a settings button with a popover will be shown containing this component
	settingsComponent?: Component<SettingsComponentProps>;

	// optionally load some extra data
	loadData?: (
		// all cards of that type
		items: Item[],
		{ did, handle, cache }: { did: Did; handle: string; cache?: CacheService }
	) => Promise<unknown>;

	// server-side version of loadData that calls external APIs directly
	// instead of going through self-referential /api/ routes (avoids 522 on Cloudflare Workers)
	loadDataServer?: (
		items: Item[],
		{
			did,
			handle,
			cache,
			env
		}: {
			did: Did;
			handle: string;
			cache?: CacheService;
			env?: Record<string, string | undefined>;
		}
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

	canAdd?: (context: { collections: string[] }) => boolean;

	onUrlHandler?: (url: string, item: Item) => Item | null;
	urlHandlerPriority?: number;

	canChange?: (item: Item) => boolean;
	change?: (item: Item) => Item;

	name?: string;

	canHaveLabel?: boolean;

	migrate?: (item: Item) => void;

	groups?: string[];

	keywords?: string[];

	icon?: string;
};
