/**
 * Top-level records: page (document root) and theme. Site record is deferred (single implicit
 * site in v1 — see plan §2). The renderer-resolution + token cascade lives here, never on nodes.
 */

/** Semantic design-token intent. Concrete values resolved by the active theme at render time. */
export interface StyleTokens {
	/** Color roles, e.g. { accent: 'pink', surface: 'stone', text: 'auto' }. */
	colors?: Record<string, string>;
	radius?: Record<string, string>;
	space?: Record<string, string>;
	font?: Record<string, string>;
	[group: string]: Record<string, string> | undefined;
}

export interface PageRecord {
	/** rkey is the page id, e.g. 'blento.self' or 'blento.<name>'. */
	$type: 'app.blento.page';
	name?: string;
	description?: string;
	/** Ordered renderer-override provider DIDs. First with an impl for a type wins. (plan §4) */
	overrides?: string[];
	/** Page-level token overrides (over site/host defaults). */
	style?: StyleTokens;
	updatedAt?: string;
	version: number;
}

export interface ThemeRecord {
	/** A portable, forkable theme: a token set + optional renderer-provider DID. */
	$type: 'app.blento.theme';
	name: string;
	tokens: StyleTokens;
	/** Optional DID that publishes custom renderer implementations (pinned/reviewed when hosted). */
	provider?: string;
	updatedAt?: string;
	version: number;
}
