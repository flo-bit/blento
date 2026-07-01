# Theming (Phase 2 tokens) — state & handoff

You are in the **`blento-theming` worktree** (branch `theming`) of the Blento monorepo (pnpm +
Turborepo; app in `apps/web`; SvelteKit 2 / Svelte 5 / Tailwind CSS v4). Goal: make the site's
appearance **token-driven and customizable**, KEEPING Tailwind. Colors were already customizable
(accent/base); this work generalizes that into a blento-owned semantic token layer.

**A second agent may be building `@blento/sources` in a sibling worktree — stay in your lane** (see
Boundaries). Read `../blento-schema-design.md` (the `## Themes + tokens` and `## Renderers` sections)
for the overall design — this file is the scoped, in-progress reality.

## How the token pipeline works (the core mechanism)

```
page.style (StyleTokens, per page)                     ← the store (design: app.blento.page.style)
  → getStyleTokens(data)   [helpers/website.ts]        ← flatten to { 'radius-card': '2rem', ... }
  → <ThemeScript tokens={…}>  [website/view/ThemeScript.svelte]
       sets --blento-<key> CSS vars on <html> (SSR inline script + client $effect)
  → app.css maps --blento-* into Tailwind theme values / direct rules
  → components use normal utilities (rounded-card, [box-shadow:var(...)], body font) that resolve
    through the overridable vars. Default of every token == today's look → pixel-0px.
```
Colors (accent/base) are a **separate, pre-existing** mechanism: `ThemeScript` adds a color class
(e.g. `.pink .stone`) to `<html>`, and `@foxui/core/theme.css` maps that to `--accent-*`/`--base-*`.
That was not changed; the new pipeline is for the non-color tokens.

## Done (branch `theming`, 4 commits on top of main)

| Token | Definition | Default | Applied at |
|---|---|---|---|
| accent / base color | `@foxui` color class on `<html>` (pre-existing) | pink / stone | everywhere via `bg-accent-*` etc. |
| `--blento-radius-card` | `app.css` `@theme inline { --radius-card: var(--blento-radius-card, 1.5rem) }` → `rounded-card` utility | 1.5rem (= old `rounded-3xl`) | `BaseCard` + hero decorations + section chrome + edit drop-zones |
| `--blento-shadow-card` | `BaseCard` class `[box-shadow:var(--blento-shadow-card,0_0_#0000)]` | invisible | grid cards |
| `--blento-font-body` | `app.css` `body { font-family: var(--blento-font-body, inherit) }` | inherit | whole page |

- **`getStyleTokens`** (`helpers/website.ts`) flattens `publication.style` groups `radius/shadow/space/font`
  → `--blento-<group>-<key>` pairs (e.g. `style.radius.card` → `--blento-radius-card`).
- **`publication.style?: StyleTokens`** added to the type (`lib/types.ts`); `StyleTokens` comes from
  `@blento/schema` (`records.ts`).
- **Dev switcher** `website/view/DevThemeSwitcher.svelte` (rendered `{#if dev}` in `Website.svelte`):
  press **1–6** to flip presets (Default/Ocean/Sunset/Forest/Grape/Rose) varying color+radius+shadow+font.
  Applies the same `--blento-*` vars live; reload restores the real theme. Never ships (dev-only).

## The pattern to add a token (repeat this)

1. **Define** the token in `app.css`: either a `@theme inline` value backed by `var(--blento-x, <default>)`
   (when you want a Tailwind utility like `rounded-card`), or a direct rule / arbitrary property on the
   component `[prop:var(--blento-x,<default>)]`. **Default must equal today's value.**
2. **Migrate** the hardcoded value in the component(s) to use it.
3. **Wire the store**: `getStyleTokens` already flattens `radius/shadow/space/font` groups — add a new
   group there if needed.
4. **Add it to the switcher** presets (`DevThemeSwitcher.svelte`) + `tokenKeys`, so you can preview it.
5. **Gate**: default renders pixel-0px vs prod; then prove the override *does* something (temporarily
   make `getStyleTokens` return a forced value, screenshot, confirm a non-zero diff, revert). See Gate.

## What's left (roughly prioritized)

1. **More token dimensions** (same pattern, each 0px-default):
   - **Grid spacing** — `margin = 16` is a **JS constant** in `apps/web/src/lib/index.ts`, used by the
     grid layout math (card translate/size), NOT CSS. Tokenizing it means threading a value through the
     grid calc (`sections/GridSection` + wherever the math lives). Most visible spacing lever; also the
     hardest. (Card *padding* is per-card-type, so there's no single clean token.)
   - **Button radius** — `rounded-2xl` on buttons/CTAs (hero CTA `HeroSection.svelte`, etc.) →
     `--blento-radius-button`.
   - **Surface** — card border/ring, page background treatment.
   - **Type scale** — font sizes/weights, not just family.
   - **Profile** — avatar size, name size (currently hardcoded in `website/view/Profile.svelte`).
   - Hunt for components that render their own container and bypass tokens (we already fixed the hero
     that way — the fix is always: swap the hardcoded value for the token).
2. **Node-level `style.tokens`** (per-card overrides cascading over page tokens). The node envelope has
   `style.tokens`; `nodesToItems` (in `@blento/schema`) currently only projects `style.tokens.color` →
   `Item.color`. To support per-card radius/shadow/etc., carry `node.style.tokens` onto the `Item`
   (extend the projection) and have `BaseCard` set them as inline `--blento-*` vars on the card element.
   Coupled to the Item projection; cleaner after a render-from-nodes pass.
3. **Picker UI + storage** (make it user-facing, not just dev):
   - A control in `website/settings/sections/PageSection.svelte` (next to `SelectTheme`) that writes
     `data.publication.style` (radius/font/…), with live preview in the editor.
   - **Save path**: `helpers/save.ts` must write `publication.style`; and the record lexicon must accept
     a `style` field — add `style` to `apps/web/lexicons/custom/app/blento/page.json` (and regenerate
     with `pnpm generate` + `pnpm exec lex-cli generate`). `site.standard.publication` (legacy main-page
     store) is external/strict — prefer landing this after the node migration makes `app.blento.page` the
     root, or gate to sub-pages first.
4. **`app.blento.theme` records** (portable token bundles): a page references an ordered `themes` list;
   the token cascade host→site→page→node. This is the marketplace/forkable-theme tier — later.

## The gate (how to validate every change)

Harness is `packages/diff-harness`. Run the app, snapshot prod vs local, diff.
```bash
pnpm --filter @blento/web dev   # or `pnpm web` from apps/web; note the port
# gate DID (a grid site): did:plc:s42iw2fbfmgsgh7hdtvvoaao   (prod: https://blento.app/<did>)
pnpm --filter @blento/diff-harness screenshot "http://localhost:<port>/<did>" /tmp/t/local.png
pnpm --filter @blento/diff-harness screenshot "https://blento.app/hoopinformatics.bsky.social" /tmp/t/prod.png
pnpm --filter @blento/diff-harness pixel /tmp/t/prod.png /tmp/t/local.png /tmp/t/diff.png
```
- **Expected residual (NOT a regression):** ~120px for the dev switcher indicator (bottom-left), plus
  (on a content diff) one `blento.app/<handle>` self-link and one avatar CDN transform per site —
  those are env/profile, not your change. A token's *default* must not change the cards.
- **Override proof** (that the token actually flows): temporarily edit `getStyleTokens` to `return { '<key>': '<value>' }`,
  screenshot, confirm a non-zero pixel diff, then revert. (radius `0px`, shadow, and font were proven
  this way at 0.1–0.6%.)
- Also require `pnpm --filter @blento/web check` → **0 errors / 0 warnings**.

## Boundaries (don't collide with the sources agent)

- **DO touch:** `app.css`, `website/view/ThemeScript.svelte` + `DevThemeSwitcher.svelte`, component
  class strings, `helpers/website.ts` (`getStyleTokens`), `website/settings/**` (picker), `lib/types.ts`
  (publication.style), the page lexicon (for the picker's `style` field).
- **DO NOT touch:** `packages/sources/**`, the data-loading path in `website/data/load.ts`
  (`loadAdditionalData` / sources), or `packages/schema/src/node.ts` (the envelope) except reading
  `StyleTokens`. Editing `nodesToItems` for node-level tokens is fine but coordinate — it's shared code.

## Key files
- `apps/web/src/app.css` — token definitions (`@theme` radius, body font).
- `apps/web/src/lib/website/view/ThemeScript.svelte` — applies `--blento-*` vars from `tokens`.
- `apps/web/src/lib/website/view/DevThemeSwitcher.svelte` — dev switcher + presets.
- `apps/web/src/lib/helpers/website.ts` — `getStyleTokens`.
- `apps/web/src/lib/types.ts` — `publication.style?: StyleTokens`.
- `apps/web/src/lib/cards/_base/BaseCard/BaseCard.svelte` — `rounded-card` + shadow token.
- `apps/web/src/lib/website/settings/sections/PageSection.svelte` — theme settings (color picker; add tokens here).
- `packages/schema/src/records.ts` (`StyleTokens`), `migrate.ts` `migratePage` (accent/base → page.style.colors; unused today).
