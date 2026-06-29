/**
 * Data freeze — record/replay the upstream data a render depends on, so the v2 render and the live
 * snapshot are compared on identical inputs (not live bluesky/event drift). Plan §9.
 *
 * STUB — depends on the v2 data loaders, which don't exist yet (Phase 5/7). Decided design:
 *
 *  1. At snapshot time, capture not just HTML but each site's upstream loader inputs — i.e. record
 *     the responses the card `source`/`loadDataServer` calls would make (bluesky posts, events,
 *     lastfm, github, …), keyed by request. Save alongside the HTML as `<did>.data.json`.
 *  2. When rendering the v2 app for that site, route its loaders' outbound fetches through a
 *     replay layer seeded from `<did>.data.json` (cache hit → recorded response; miss → real fetch
 *     + warn). This makes the v2 render deterministic against the captured instant.
 *  3. report.ts then diffs HTML rendered from the *same* data → divergences are real rendering
 *     changes, not data drift.
 *
 * Until the v2 loaders exist, the cheaper interim is to snapshot + render close in time and rely on
 * the structural diff ignoring volatile leaf text. Implement true freeze when loaders land.
 */

export interface FrozenData {
	did: string;
	/** request key -> recorded JSON response */
	responses: Record<string, unknown>;
}

export function createReplay(_frozen: FrozenData): never {
	throw new Error('freeze: implement once v2 data loaders exist (Phase 5/7) — see plan §9');
}
