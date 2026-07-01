/**
 * The `#atproto` kind: any XRPC query. `method` (NSID) + `params` + optional `service`.
 *
 * Server resolution policy:
 *   - `com.atproto.repo.*` / `com.atproto.sync.*`  → the actor's PDS (did→PDS via plc.directory).
 *   - everything else → the named `service` (must be allow-listed) else a known-appview registry
 *     (default: bsky public appview). An unlisted / unknown `service` is refused (gated).
 */
import type { ResolveResult, Source, SourceContext } from './types.js';
import { resolvePds } from './identity.js';

/** Built-in default appview. Doubles as the default allow-listed service. */
export const DEFAULT_APPVIEW = 'https://public.api.bsky.app';

type AtprotoSource = Extract<Source, { $type: 'app.blento.source#atproto' }>;

/** Substitute context vars (`$self` today) into a param value, recursing through arrays/objects. */
function substitute(value: unknown, ctx: SourceContext): unknown {
	if (typeof value === 'string') {
		// exact match is the common case (`actor: '$self'`); also interpolate inside longer strings
		if (value === '$self') return ctx.self;
		return value.includes('$self') ? value.split('$self').join(ctx.self) : value;
	}
	if (Array.isArray(value)) return value.map((v) => substitute(v, ctx));
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>))
			out[k] = substitute(v, ctx);
		return out;
	}
	return value;
}

/**
 * Return the source with all context vars substituted into its params. Done ONCE up front so the
 * cache key and the actual fetch see the identical resolved spec.
 */
export function substituteAtproto(source: AtprotoSource, ctx: SourceContext): AtprotoSource {
	return { ...source, params: substitute(source.params ?? {}, ctx) as Record<string, unknown> };
}

const isRepoOrSync = (method: string) =>
	method.startsWith('com.atproto.repo.') || method.startsWith('com.atproto.sync.');

/** Pick the base URL for an appview query, enforcing the service allowlist. */
function resolveAppview(service: string | undefined, ctx: SourceContext): string {
	const def = ctx.defaultAppview ?? DEFAULT_APPVIEW;
	if (!service) return def;
	const allowed = new Set([def, DEFAULT_APPVIEW, ...(ctx.appviews ?? [])]);
	if (!allowed.has(service)) {
		throw new Error(`atproto source refused: service "${service}" is not allow-listed`);
	}
	return service;
}

/**
 * Resolve an ALREADY-substituted `#atproto` source into `{ data, nextCursor }`.
 * (Call `substituteAtproto` first — `resolve()` does this so the cache key matches the fetch.)
 */
export async function resolveAtproto(
	source: AtprotoSource,
	ctx: SourceContext,
	cursor: string | undefined
): Promise<ResolveResult> {
	const fetchImpl = ctx.fetchImpl ?? fetch;

	const params: Record<string, unknown> = { ...(source.params ?? {}) };
	if (cursor !== undefined) params.cursor = cursor;

	const base = isRepoOrSync(source.method)
		? await resolvePds(ctx.self, resolveAppview(source.service, ctx), fetchImpl)
		: resolveAppview(source.service, ctx);

	const url = new URL(`/xrpc/${source.method}`, base);
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === null) continue;
		if (Array.isArray(v)) for (const item of v) url.searchParams.append(k, String(item));
		else url.searchParams.set(k, String(v));
	}

	const res = await fetchImpl(url);
	if (!res.ok) {
		throw new Error(`atproto ${source.method} failed: ${res.status} ${res.statusText}`);
	}
	const data = (await res.json()) as unknown;
	const nextCursor =
		data && typeof data === 'object' && typeof (data as { cursor?: unknown }).cursor === 'string'
			? (data as { cursor: string }).cursor
			: undefined;

	return { data, nextCursor };
}
