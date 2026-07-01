/**
 * Public types for `@blento/sources`.
 *
 * A `Source` (imported from `@blento/schema`) is a declarative read. `resolve()` turns it into typed
 * data. Renderers never see a `Source` — only the already-fetched JSON this package produces.
 */
import type { Source } from '@blento/schema';

export type { Source };

/**
 * Ambient inputs a source needs to resolve that are NOT part of the stored spec: the page owner
 * (for `$self`), the fetch implementation, and the two security allowlists (data, not code).
 */
export interface SourceContext {
	/** Page owner did or handle. Substituted for the `$self` param var. */
	self: string;
	/** Fetch implementation (defaults to the global `fetch`). Injectable for tests / Workers. */
	fetchImpl?: typeof fetch;
	/**
	 * Host allowlist for `#http` sources (bare hostnames, e.g. `api.example.com`). Empty / undefined
	 * ⇒ every `#http` fetch is refused. Arbitrary server-side fetch is the risk surface.
	 */
	httpAllowlist?: string[];
	/**
	 * Allowed appview base URLs for non-repo/sync `#atproto` queries, IN ADDITION to the built-in
	 * default (bsky public appview). A `service` not in this set is refused (gated).
	 */
	appviews?: string[];
	/** Override the default appview used when a `#atproto` source names no `service`. */
	defaultAppview?: string;
}

/** A minimal, injectable cache. The app supplies KV; tests use the in-memory adapter. */
export interface CacheAdapter {
	get(key: string): Promise<string | null> | string | null;
	set(key: string, value: string, ttl?: number): Promise<void> | void;
}

/** Options for a single `resolve()` call. */
export interface ResolveOptions {
	/** Pagination cursor to fetch the next page (threaded into the underlying query). */
	cursor?: string;
	/** Optional cache. When present, results are read/written under a spec-derived key. */
	cache?: CacheAdapter;
	/** TTL (seconds) for cache writes. */
	ttl?: number;
}

/** The result of resolving one source: the fetched data plus an optional next-page cursor. */
export interface ResolveResult {
	data: unknown;
	nextCursor?: string;
}
