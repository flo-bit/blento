# Sections: launch TODO

Everything needed before sections can be enabled for all users (remove feature flag).

## Critical / Blocking

- [ ] **Page copy must include sections** — the copy route (`/p/[[page]]/copy/+page.svelte`) only copies cards today; section records are silently dropped, so the copied page loses all structure and non-grid section types
- [ ] **Migration for existing users** — `ensureSections()` in `migrate.ts` synthesises a single grid section for legacy pages, but verify this works cleanly for users who already have cards with no `sectionId` across multiple pages

## Section editing UI gaps

- [ ] **Gallery section: column count control** — `sectionData.columns` is read but there's no UI to change it
- [ ] **Gallery section: gap control** — `sectionData.gap` is read but there's no UI to change it
- [ ] **Text section: alignment/size controls** — `textAlign` and `textSize` are in `sectionData` but no editing UI exposes them
- [ ] **Row section: scroll mode control** — `sectionData.scrollMode` (`'scroll'` | `'fit'`) has no UI toggle
- [ ] **Section renaming** — `section.name` field exists on the record but there's no input to edit it (SectionsModal only displays the name)
- [ ] **Section duplication** — no way to duplicate a section (with or without its cards)

## Cross-section interactions

- [ ] **Move cards between sections** — cards are locked to the section they were created in; no drag-to-another-section or "move to section" action exists
- [ ] **Section collapse/expand in editor** — all sections are always fully expanded; pages with many sections get unwieldy

## Section styling / customisation

- [ ] **Background color per section** — no way to set a section background (color, gradient, image)
- [ ] **Padding / spacing controls** — no per-section padding or vertical gap control
- [ ] **Section max-height** — only HeroSection enforces a height (`100dvh`); other sections grow unbounded

## Mobile

- [ ] **Mobile editing parity** — TextSection and RowSection don't have mobile-specific editing controls; the mobile editing warning modal is still shown as "experimental"

## Polish / UX

- [ ] **Empty state for TextSection editing** — no placeholder or guidance when the text content is blank
- [ ] **SectionsModal improvements** — modal is functional but minimal; consider drag-to-reorder instead of up/down buttons, section type icons, and inline rename
- [ ] **AddSectionButton visibility** — button is `opacity-0` until parent hover; may be hard to discover on touch devices
- [ ] **Confirm before deleting a section with cards** — currently deletes immediately; should warn if the section contains cards

## Deferred / post-launch

- [ ] **External data sources** — see `docs/todo/external-section-sources.md`
- [ ] **Section-level permissions / visibility** — e.g. hide a section from non-authenticated viewers
- [ ] **Section templates** — pre-built section layouts users can pick from when adding a section
