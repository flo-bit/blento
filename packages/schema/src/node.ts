/**
 * The Blento v2 node envelope — the frozen contract.
 *
 * New card / layout / theme types MUST NOT change this shape. They only put new shapes into the
 * open blobs (`data`, `layout`, `style`, `source`) and register a renderer. See blento-v2-plan.md §2.
 */

/** Generic behavior class. Drives editor/runtime treatment, not the specific renderer. */
export type NodeKind = 'document' | 'container' | 'leaf';

/**
 * A declared read capability. Resolved by trusted first-party loaders; renderers only ever
 * receive already-fetched JSON. See plan §6.
 */
export type Source =
	| { kind: 'atproto-collection'; actor: string; collection: string; limit?: number; prop?: string }
	| { kind: 'http'; url: string }
	| { kind: 'subscribe'; channel: string }; // deferred (app-grade realtime)

export interface Node {
	/** rkey (TID). */
	id: string;
	/** Semantic interface key (NSID-style): 'grid' | 'link' | 'bluesky' | 'event' | ... */
	type: string;
	/** Generic behavior class. */
	kind: NodeKind;
	/** Structural edge: containing node id. null = page/document root. */
	parent: string | null;
	/** Order among siblings — a STRING fractional key (never a float; atproto forbids floats). */
	rank: string;
	/** Denormalized partition/query key: the root document id this node belongs to. */
	page: string;
	/** CONTENT. Pure JSON, never markup. (v1's cardData.) */
	data: unknown;
	/** Optional declared read capability. First-class so it is inspectable without running renderers. */
	source?: Source;
	/** POSITION within the parent, interpreted by the parent container's type. Integers only. */
	layout?: unknown;
	/** APPEARANCE intent the active renderer interprets (color role, variant). Never concrete CSS. */
	style?: unknown;
	version: number;
}

/** Layout blob shapes, keyed by the parent container type that interprets them. */
export interface GridLayout {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface FreeLayout {
	x: number;
	y: number;
	z?: number;
	rotation?: number;
}

/** Ordered containers (columns/rows/flow/document) carry no layout — order comes from `rank`. */
export type OrderedLayout = undefined;

export const SCHEMA_VERSION = 1;
