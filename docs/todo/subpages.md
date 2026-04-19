# Subpages — path to usability

Subpages already work record- and route-wise (`app.blento.page`, routes under `/[actor]/p/[page]`), but there is no UI to create them, no way to navigate between them, and several metadata gaps. This doc lists everything needed to make subpages a usable first-class feature.

## Creation & management

- [ ] Create-subpage UI
  - Pick slug → create `app.blento.page/blento.{slug}` record with empty sections
  - Initial name/description fields
- [ ] Rename (display name) — write-back to `app.blento.page`
- [ ] Change slug
  - rkey is immutable, so: create new record + migrate cards/sections (`page` field) + delete old record
- [ ] Delete subpage
  - Cascade delete sections and cards where `page === 'blento.{slug}'`
- [ ] Manage subpages panel (settings? edit bar dropdown?)
- [ ] Slug validation
  - Reserved: `self`, `edit`, `copy`
  - Character restrictions matching rkey rules

## Discovery & navigation

- [ ] Navbar / nav links on the main page (and likely all pages)
- [ ] "Link to subpage" card type (picks a subpage, renders name/icon)
  - Arguably shares a data source with the navbar
- [ ] Back-to-home affordance on subpages (logo/name tap? explicit home link?)
- [ ] Subpages in sitemap / Contrail indexing — probably yes so shared links resolve fresh

## OG / metadata per page

- [ ] Per-subpage OG image
  - `og-new.png` endpoint currently keys on actor only; include `page` in cache key + screenshot URL
- [ ] Wire per-page title/description/icon from `app.blento.page` into `<Head>` on subpage routes

## Editing experience

- [ ] Entry point from main-page edit → switch to editing a subpage (page switcher in edit mode)
- [ ] Verify self-copy flow for duplicating one of your own pages

## Navbar record placement — decision

Three options for where navigation links live:

- **A.** `site.standard.publication/blento.self` preferences — simplest, one record. But nav isn't really a "preference."
- **B.** Extend `app.blento.page/blento.self` with a `navigation` array — clean, no new lexicon, couples nav to the main-page record.
- **C.** New `app.blento.navigation/self` record — cleanest semantically, extra lexicon to maintain.

**Picked: B.** Main-page publication record is already the canonical site config, nav is sitewide and only edited from the main page. If per-subpage overrides ever become a need, migrate then.

## Open questions (not required for v1)

- Page privacy / password gating
- Per-page theme overrides
- Page templates / duplicate-as-template
