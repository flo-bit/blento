# Card Settings → Sidebar migration

Moving all card settings out of popups and into the left settings sidebar
(`src/lib/website/SettingsSidebar.svelte` — also hosts section + layout settings), and surfacing **everything** that can be
changed for a card — including options that today are only editable inline or in the
creation modal.

While doing this we also upgrade the **design** of every settings panel to a consistent,
polished look using a shared set of reusable building blocks.

## Decisions

- **Text-bearing cards**: keep inline editing AND add the same fields to the sidebar (two entry points, one source of truth in `cardData`).
- **Source-only cards**: add an editable "source/URL" panel — high-traffic ones first (BigSocial, YouTube, Spotify, GitHub Profile, Bluesky Post), then the rest.
- **Build order**: Image card end-to-end first to establish the pattern, then generalize.

## Architecture notes

- The sidebar already renders `cardDef.settingsComponent` in a **Content** tab; the
  **Design** tab handles background color + size. Settings components receive
  `{ item, onclose }` (`SettingsComponentProps`).
- `EditBar.svelte` still has a redundant settings popover → remove once the sidebar covers everything.
- Settings components today are stylistically inconsistent (raw `<select>`, ad-hoc button
  groups, mixed foxui usage). The reusable components below fix that.

---

## Reusable settings components (`src/lib/cards/_settings/`)

- [x] `SettingsSection.svelte` — titled section (uppercase xs header) matching the Design tab
- [x] `SettingsField.svelte` — label + optional description + slot for the control
- [x] `SettingsToggle.svelte` — checkbox row (label + optional description), bindable `checked` + `onCheckedChange`
- [x] `SettingsSegmented.svelte` — segmented button group (options + bindable `value`); replaces raw button groups (Friends, LastFM period, Margin, Statusphere mode)
- [x] `SettingsAlignToggle.svelte` — vertical / horizontal align toggle group (Text, Section, Hero)
- [x] `SettingsTextSize.svelte` — text-size stepper with level indicator (Text, Section, Hero)
- [x] `SettingsImagePicker.svelte` — current image preview + change/upload + remove (Image, Link, SecretImage, BlueskyMedia)
- [x] `SettingsLinkField.svelte` — "link to a URL" toggle → reveals URL input + optional link label (Image, Button, Hero)
- [x] `SourceSettings.svelte` — **one shared panel** for source-only cards: edits the source URL via the card's `onUrlHandler` (or a `source.apply` override). Configured per card with a `source: { label, placeholder, errorMessage, currentUrl?, apply? }` field on the `CardDefinition`. Preserves card size on re-apply. Imported directly (not via barrel) to avoid a module cycle.
- [x] `index.ts` — barrel export

---

## Common controls (already in the Design tab — keep/refine)

- [x] Background color (modes + custom swatch)
- [x] Size presets
- [ ] Label / caption field for `canHaveLabel` cards (move into sidebar)

---

## Core

- [x] **Image** (`image`)
  - **Change image** button (upload, replace-only — no preview, no remove)
  - alt text (3-row textarea)
  - "link this card to a URL" toggle → URL field (link label dropped — not visible on card)
- [x] **Link** (`link`)
  - URL + re-fetch info button
  - title (synced inline ↔ sidebar)
  - favicon (compact picker) + preview image (compact picker, removable)
  - "show as background image" toggle
  - _description dropped_ (not rendered by the read-only card)
- [x] **Text** (`text`)
  - content (markdown textarea, synced inline ↔ sidebar)
  - vertical align · horizontal align · text size
- [x] **Section / Heading** (`section`)
  - heading text (synced inline ↔ sidebar)
  - vertical align · horizontal align · text size
- [x] **Map** (`mapLocation`)
  - change location (search + geocode, shows current location name)
  - "link to Google Maps" toggle

## Utilities

- [x] **Button** (`button`) — button text (synced inline ↔ sidebar) · link URL
- [x] **Clock** (`clock`) — timezone select + "Local" (refreshed design)
- [x] **Countdown** (`countdown`) — target date + time (refreshed design)
- [ ] ~~**Timer** (`timer`)~~ — deprecated (migrates to clock/countdown), skip

## Visual

- [x] **Fluid Text** (`fluid-text`) — text · font-size slider (refreshed design)
- [ ] **Draw** (`draw`) — NEW panel: stroke width · clear/undo · lock toggle · color

## Sections

- [x] ~~**Hero** (`hero`)~~ — **removed** (replaced by the Hero _section_); orphaned card folder deleted

## Social

- [x] **Friends** (`friends`) — add friend + list (avatar + handle) with remove
- [x] **GitHub Contributors** (`githubContributors`) — layout · shape (segmented)
- [x] **Margin** (`margin`) — show bookmarks/annotations/highlights (toggles)
- [x] **vCard** (`vcard`) — easy/expert editor (refreshed design)
- [x] **BigSocial** (`bigsocial`) — `SourceSettings` (edit URL, auto-detects platform)
- [x] **Bluesky Post** (`blueskyPost`) — `SourceSettings` (edit post URL)
- [x] **GitHub Profile** (`githubProfile`) — `SourceSettings` (edit profile URL)
- [x] **Kickstarter** (`kickstarter`) — `SourceSettings`
- [x] **Semble** (`sembleCollection`) — `SourceSettings`
- [x] **Bluesky Feed** (`blueskyFeed`) — `SourceSettings` (with `currentUrl` reconstruction from did/handle)
- [ ] _Source cards still needing wiring_ (no `onUrlHandler` → need `source.apply`, or complex cardData): Guestbook, Product Hunt, ATProto Collections, Event, Kich Recipe/Collection, RPG Actor
- [ ] _Display-only (no settings needed)_: Bluesky Profile, Latest Post, Upcoming Events, Upcoming RSVPs, npmx Likes/Leaderboard, Germ DM, Kich Cooking Log, Updated Blentos

## Media

- [x] **GIF** (`gif`) — change GIF (Giphy) · alt text
- [x] **YouTube** (`youtubeVideo`) — change video URL · "open fullscreen" toggle _(high-traffic source card)_
- [x] **Secret Image** (`secretImage`) — change image (button) · password
- [x] **Statusphere** (`statusphere`) — mode (segmented); emoji still picked inline
- [x] **Bluesky Media** (`blueskyMedia`) — change media (re-opens picker) · link (own panel, no longer reuses ImageCardSettings)
- [x] **Last.fm Top Tracks / Top Albums** (`lastFMTopTracks`, `lastFMTopAlbums`) — username + period (segmented), via shared `LastFMPeriodSettings`
- [x] **Spotify** (`spotify-list-embed`) — `SourceSettings`
- [x] **Apple Music** (`apple-music-embed`) — `SourceSettings`
- [x] **SoundCloud** (`soundcloud-embed`) — `SourceSettings`
- [x] **Photo Gallery** (`grain-gallery`) — `SourceSettings`
- [ ] _Source cards still needing wiring_: Embed, Plyr.fm Song/Collection, Livestream/Embed
- [ ] _Display-only (no settings)_: Last.fm Recent/Profile, all ListenBrainz, Popfeed, Rocksky, Teal.fm

## Content / Games

- [ ] **Publication List** (`publicationList`) — display-only, no settings
- [ ] **Dino / Tetris** — no settings

---

## Sidebar text editing for inline rich-text fields — DONE

`PlainTextEditor` and `MarkdownTextEditor` now have a **focus-guarded external-sync** `$effect`:
when `contentDict[key]` changes from outside (e.g. the sidebar) and the editor is not focused, it
applies `setContent(..., { emitUpdate: false })`. MarkdownTextEditor uses a `lastIncoming` guard to
avoid a re-sync loop from markdown round-trip differences. This makes inline + sidebar editing stay
in sync for: Text content (markdown textarea), Link title, Section heading — and unlocks the same
for Button label / Hero fields when those panels are built.

## Cleanup

- [x] Remove the redundant settings popover from `EditBar.svelte` — then deleted `EditBar.svelte` entirely (orphaned after the bottom-bar refactor)
- [x] Deleted other orphaned/dead components: `website/SettingsModal.svelte`, `components/ImageDropper.svelte`, `EmbedCard/SidebarItemEmbedCard.svelte`, `LatestBlueskyPostCard/SidebarItemLatestBlueskyPostCard.svelte`
- [x] Verified all `_settings` exports are used; `.ts` "orphans" are legit tests/dev-scripts
- [x] `pnpm check` 0 errors · `pnpm lint` clean (warnings only in the sibling `atmo-events` package)
