/**
 * The Blento node envelope — the stored record shape.
 *
 * Two decoupled typed axes: `content.$type` is the DATA shape (an open union of `app.blento.defs`
 * members — interop), while `style.renderer` is the RENDER type (defaults from `content.$type`,
 * overridable). There is deliberately NO top-level `type` string. New card / layout / theme types
 * only add members to the open blobs (`content`, `layout`, `style`, `source`) and register a
 * renderer/def — the envelope never changes. See ../../../blento-schema-design.md.
 */

/** Structural role. Drives editor/runtime treatment, not the specific renderer. */
export type NodeKind = 'document' | 'container' | 'leaf';

/** CONTENT — the data. `$type` = the data shape (open union of `app.blento.defs`). */
export interface Content {
	$type: string;
	[k: string]: unknown;
}

/** POSITION within the parent, typed by the parent container's contract (e.g. `#gridCell`). */
export interface Layout {
	$type: string;
	[k: string]: unknown;
}

/** PRESENTATION intent. Never concrete CSS. */
export interface Style {
	/** Renderer id/ref override; the default resolves from `content.$type`. */
	renderer?: string;
	/** Semantic design tokens (color roles, etc.). */
	tokens?: Record<string, string>;
	[k: string]: unknown;
}

/**
 * A declared read. Resolved by trusted first-party loaders; renderers only ever receive
 * already-fetched JSON. `atproto` is any XRPC query (output typed by the method's lexicon or the
 * explicit `outputs`); `ref` shares another node's loaded data. See the design doc §Source.
 */
export type Source =
	| {
			$type: 'app.blento.source#atproto';
			method: string;
			params?: Record<string, unknown>;
			service?: string;
			outputs?: unknown;
	  }
	| { $type: 'app.blento.source#http'; url: string; outputs?: unknown }
	| {
			$type: 'app.blento.source#custom';
			loader: string;
			params?: Record<string, unknown>;
			outputs?: unknown;
	  }
	| { $type: 'app.blento.source#ref'; node: string };

export interface Node {
	/** rkey (TID). */
	id: string;
	/** Structural role. */
	kind: NodeKind;
	/** Containing node id. null = page/document root. */
	parent: string | null;
	/** Order among siblings — a STRING fractional key (never a float; atproto forbids floats). */
	rank: string;
	/** Denormalized partition/query key: the root document id this node belongs to. */
	page: string;
	/** The data. `content.$type` is the shape and the default renderer key. */
	content: Content;
	/** Position within the parent. Integers only. */
	layout?: Layout;
	/** Appearance intent (renderer override + tokens). */
	style?: Style;
	/** Declared read capability — inspectable without running renderers. */
	source?: Source;
	version: number;
}

export const SCHEMA_VERSION = 1;

/** Def NSIDs. The migration uses the generic fallbacks; typed defs (#link, #image, …) are additive. */
export const CARD_CONTENT = 'app.blento.defs#card';
export const CONTAINER_CONTENT = 'app.blento.defs#container';
export const GRID_CELL_LAYOUT = 'app.blento.defs#gridCell';
