/**
 * `resolve()` — the core entry point — and `resolveGraph()` for `#ref` sharing.
 *
 * A source fetches ONE page. The caller decides how far to walk (via `nextCursor`). Results are
 * read/written through an optional injectable cache, keyed by the resolved spec (+ cursor).
 */
import type { Node } from '@blento/schema';
import type {
	CacheAdapter,
	ResolveOptions,
	ResolveResult,
	Source,
	SourceContext
} from './types.js';
import { resolveAtproto, substituteAtproto } from './atproto.js';
import { resolveHttp } from './http.js';
import { cacheKey } from './cache.js';

/**
 * Return the source with context vars substituted — the canonical spec used for BOTH cache key and
 * fetch. Only `#atproto` params reference context vars today; other kinds pass through unchanged.
 */
function resolveSpec(source: Source, ctx: SourceContext): Source {
	return source.$type === 'app.blento.source#atproto' ? substituteAtproto(source, ctx) : source;
}

async function readCache(cache: CacheAdapter, key: string): Promise<ResolveResult | undefined> {
	const raw = await cache.get(key);
	if (raw == null) return undefined;
	try {
		return JSON.parse(raw) as ResolveResult;
	} catch {
		return undefined;
	}
}

/** Dispatch a resolved (substituted) source to its kind handler. */
async function dispatch(
	source: Source,
	ctx: SourceContext,
	cursor: string | undefined
): Promise<ResolveResult> {
	switch (source.$type) {
		case 'app.blento.source#atproto':
			return resolveAtproto(source, ctx, cursor);
		case 'app.blento.source#http':
			return resolveHttp(source, ctx);
		case 'app.blento.source#custom':
			// Later gated tier — sandboxed loaders. Not built yet.
			throw new Error('custom source loaders are not implemented');
		case 'app.blento.source#ref':
			// `#ref` is resolution-layer only: it means "reuse another node's loaded data". A lone ref
			// has nothing to fetch — resolve it through resolveGraph(), which has the sibling results.
			throw new Error('#ref sources can only be resolved via resolveGraph()');
		default: {
			const exhaustive: never = source;
			throw new Error(`unknown source kind: ${JSON.stringify(exhaustive)}`);
		}
	}
}

/**
 * Resolve one declarative source into `{ data, nextCursor }`. With a cache adapter, a hit returns
 * instantly; a miss fetches then writes back under the spec-derived key.
 */
export async function resolve(
	source: Source,
	ctx: SourceContext,
	opts: ResolveOptions = {}
): Promise<ResolveResult> {
	const { cursor, cache, ttl } = opts;
	const spec = resolveSpec(source, ctx);

	if (cache) {
		const key = cacheKey(spec, cursor);
		const hit = await readCache(cache, key);
		if (hit) return hit;
		const result = await dispatch(spec, ctx, cursor);
		await cache.set(key, JSON.stringify(result), ttl);
		return result;
	}

	return dispatch(spec, ctx, cursor);
}

/** A node with an (optional) inline source — the subset of `@blento/schema`'s `Node` we need. */
type SourcedNode = Pick<Node, 'id' | 'source'>;

/**
 * Resolve every node's inline source, then alias `#ref` nodes to their owner's result.
 *
 * Identical inline fetches are deduped by cache key so each distinct source runs once. `#ref` → an
 * owner that is itself a `#ref` is disallowed (no ref→ref chains); a dangling / non-source owner
 * yields `null`. Returns a map of nodeId → result (or `null` when the node has no resolvable data).
 */
export async function resolveGraph(
	nodes: SourcedNode[],
	ctx: SourceContext,
	opts: ResolveOptions = {}
): Promise<Record<string, ResolveResult | null>> {
	const REF = 'app.blento.source#ref';
	const out: Record<string, ResolveResult | null> = {};

	// 1. Resolve each distinct inline (non-ref) source once, deduped by cache key.
	const inline = nodes.filter((n) => n.source && n.source.$type !== REF);
	const byKey = new Map<string, Promise<ResolveResult>>();
	const nodeKey = new Map<string, string>();

	for (const node of inline) {
		const spec = resolveSpec(node.source!, ctx);
		const key = cacheKey(spec, opts.cursor);
		nodeKey.set(node.id, key);
		if (!byKey.has(key)) byKey.set(key, resolve(node.source!, ctx, opts));
	}

	const settled = new Map<string, ResolveResult | null>();
	await Promise.all(
		[...byKey.entries()].map(async ([key, p]) => {
			try {
				settled.set(key, await p);
			} catch {
				settled.set(key, null);
			}
		})
	);
	for (const node of inline) out[node.id] = settled.get(nodeKey.get(node.id)!) ?? null;

	// 2. Alias `#ref` nodes to their owner's already-resolved result.
	for (const node of nodes) {
		if (node.source?.$type !== REF) continue;
		const ownerId = node.source.node;
		const owner = nodes.find((n) => n.id === ownerId);
		if (owner?.source?.$type === REF) {
			throw new Error(`#ref chain not allowed: ${node.id} → ${ownerId} (also a #ref)`);
		}
		out[node.id] = ownerId in out ? out[ownerId] : null;
	}

	return out;
}

/**
 * A node enriched with its resolved data. `loaded` is RUNTIME-ONLY: the schema's `nodeToRecord` is
 * allowlist-based, so this field is never serialized back to the PDS — the stored record keeps only
 * the declarative `source`. This is the object renderers receive: everything on one node.
 */
export type ResolvedNode<N extends { id: string } = Node> = N & {
	loaded?: ResolveResult | null;
};

/**
 * Resolve a graph and return each node enriched with its `loaded` data (source spec stays put).
 * A thin wrapper over `resolveGraph` for the common "hand renderers a node that carries its data"
 * shape. Nodes without a resolvable source get `loaded: undefined`.
 */
export async function resolveNodes<N extends Pick<Node, 'id' | 'source'>>(
	nodes: N[],
	ctx: SourceContext,
	opts: ResolveOptions = {}
): Promise<ResolvedNode<N>[]> {
	const map = await resolveGraph(nodes, ctx, opts);
	return nodes.map((n) => ({ ...n, loaded: map[n.id] ?? undefined }));
}
