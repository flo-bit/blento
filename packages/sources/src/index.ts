/**
 * `@blento/sources` — resolve a node's declarative `Source` into typed data.
 *
 * Pure, dependency-light: no KV, no SvelteKit, no atproto client. Inject `fetch` and a `CacheAdapter`
 * via the context/options. See ../../../blento-schema-design.md § Source.
 */
export type {
	Source,
	SourceContext,
	CacheAdapter,
	ResolveOptions,
	ResolveResult
} from './types.js';
export { resolve, resolveGraph, resolveNodes, type ResolvedNode } from './resolve.js';
export { cacheKey, MemoryCacheAdapter } from './cache.js';
export { DEFAULT_APPVIEW } from './atproto.js';
