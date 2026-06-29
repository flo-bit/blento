# Differential render harness

**The keystone de-risk for the rewrite.** Diff the new view output against the *current live site*
across all ~1000 real sites. Production is the oracle. See `../../../../blento-v2-plan.md` §9.

Covers the **view side only**. Editor behavior (drag/collision/undo/save), OAuth, and write/migration
paths are tested separately via Playwright (`apps/web/tests`) + Vitest.

## Pipeline (to build in Phase 1 — before serious generation)

1. **`snapshot.ts`** — enumerate live site identifiers (DIDs/handles) and fetch rendered HTML from
   `DIFF_LIVE_ORIGIN` for each. Save to `diff-snapshots/<id>.html` (+ the raw upstream data
   responses per site, so renders are reproducible).
2. **`freeze.ts`** — record/replay the upstream data (bluesky posts, events, external APIs) so the
   diff compares *rendering*, not live data drift. Feed identical frozen data into old + new renders.
3. **`diff.ts`** — render the same data through the new app and compare:
   - **Primary gate: structural/semantic DOM diff** — normalize then compare elements, text, hrefs,
     img srcs, order, ARIA. Robust to class changes (we drop Tailwind) and font/AA noise.
   - **Optional: pixel diff** behind a "compatibility theme" — only if we decide the view must be
     pixel-identical. Default: structural-first, accept intended visual drift.
4. **`report.ts`** — per-site pass/fail + a divergence summary. This is the objective gate for the
   one-night generation and the permanent regression net.

## Open decision (plan §12)

Structural-faithful (DOM diff is the gate — recommended) vs visually-identical (build the compat
theme + pixel diff). Given the de-Tailwind, recommend structural-first.

## Modules

- **`normalize.ts`** ✓ — HTML → canonical structural tree. Drops class/style/id/whitespace/comments,
  keeps semantic attrs (href/src/alt/role/aria/…), treats `<svg>` as an opaque leaf. This is what
  makes the diff robust to the de-Tailwind class churn.
- **`diff.ts`** ✓ — position-aligned structural diff → `Divergence[]` (tag/text/attr/missing/extra).
  ⚠️ Known limitation (found by running it): it stops descending at a tag mismatch, so when the two
  DOMs are shaped differently (v2's page shell vs v1's) it UNDER-reports — a top-level wrapper
  mismatch masks everything inside. Use `content.ts` while structures differ; use this once they converge.
- **`content.ts`** ✓ — structure-INDEPENDENT fidelity diff: compares the *set* of links/images/text
  anchors, answering "what content did the new render drop or add?" regardless of markup. This is the
  primary gate during the rewrite. CLI: `… content <liveDir> <newDir>`.
- **`sites.ts`** ✓ — enumerate live sites via the production contrail XRPC
  (`app.blento.card.listRecords` cross-actor, recency-sorted, paginated). `MAX_SITES` env caps it.
- **`snapshot.ts`** ✓ — fetch each site's HTML from `DIFF_LIVE_ORIGIN`, save `diff-snapshots/<did>.html`
  + a `manifest.json`. **Run after the open v1 PRs merge** so new cards are in the oracle.
- **`compare.ts`** ✓ — single-file CLI: `pnpm --filter @blento/diff-harness compare <live.html> <new.html>`.
- **`report.ts`** ✓ — batch CLI: `… report <liveDir> <newDir>` → per-site divergence summary,
  worst-first; exit 1 if any site diverges or is missing. The pass/fail gate for the view side.
- **`normalize.test.ts`** ✓ — proves class/style/whitespace/svg-internal changes are ignored while
  href/text/structure changes are flagged. `pnpm --filter @blento/diff-harness test` (4/4).
- **`freeze.ts`** ⧗ — stub. Record/replay upstream data so the diff compares rendering, not bluesky/
  event drift. Design is decided; implementation waits on the v2 data loaders (Phase 5/7).

## Workflow

```
pnpm --filter @blento/diff-harness sites      # enumerate (MAX_SITES=N to cap)
pnpm --filter @blento/diff-harness snapshot   # capture live oracle -> diff-snapshots/
# … render v2 for the same sites into another dir (Phase 5) …
pnpm --filter @blento/diff-harness report diff-snapshots <v2-render-dir>
```

## Status

Real and validated end-to-end against production (snapshot→normalize→diff): a self-compare of 5 live
sites reports 0 divergences, and an injected change is caught. Remaining: `freeze` (needs v2 loaders)
and wiring the v2 render output as the `report` "new" side. `diff-snapshots/` is git-ignored.
