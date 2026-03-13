import type { Component } from 'svelte';

export type EmbedComponentProps = {
	url: string;
	data: Record<string, unknown>;
};

export type EmbedDefinition = {
	/** Unique identifier, e.g. 'youtube', 'spotify' */
	type: string;
	/** Attempt to match a URL. Return provider-specific data on success, or null on failure. */
	match: (url: string) => Record<string, unknown> | null;
	/** Svelte component used to render the embed. Receives EmbedComponentProps. */
	component: Component<EmbedComponentProps>;
};
