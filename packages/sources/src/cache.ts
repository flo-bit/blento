/**
 * Cache adapter + stable cache-key derivation.
 *
 * The key is computed from the RESOLVED source spec (after `$self` substitution) plus the cursor, so
 * two actors — or two cursors — never collide, and two byte-identical fetches always share a key.
 */
import type { CacheAdapter, Source } from './types.js';

/** Deterministic JSON: object keys sorted recursively so key order can't perturb the hash. */
function canonical(value: unknown): string {
	if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
	if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
	const obj = value as Record<string, unknown>;
	const parts = Object.keys(obj)
		.sort()
		.filter((k) => obj[k] !== undefined)
		.map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`);
	return `{${parts.join(',')}}`;
}

/**
 * A stable, inspectable cache key for a resolved source (+ cursor). `#ref` has no fetch of its own,
 * so it never produces a key — callers alias it to the owner's result instead.
 */
export function cacheKey(source: Source, cursor?: string): string {
	const spec = canonical(source);
	return cursor ? `sources:${spec}:@${cursor}` : `sources:${spec}`;
}

/** Trivial in-memory cache for tests and single-process consumers. TTL is ignored (no eviction). */
export class MemoryCacheAdapter implements CacheAdapter {
	private store = new Map<string, string>();

	get(key: string): string | null {
		return this.store.get(key) ?? null;
	}

	set(key: string, value: string): void {
		this.store.set(key, value);
	}

	/** Test/debug helper: number of entries currently held. */
	get size(): number {
		return this.store.size;
	}
}
