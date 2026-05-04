# Contributing Guidelines

For new cards see [CustomCards](CustomCards.md) and [CardIdeas](CardIdeas.md).

## Setup

```sh
git clone https://github.com/flo-bit/blento.git
cd blento
pnpm install
pnpm env:setup-dev   # creates .env, fills COOKIE_SECRET + CLIENT_ASSERTION_KEY
```

In `wrangler.jsonc`, flip the `DB` binding's `"remote": true` to `false` if not already set to false (don't commit that). Otherwise `pnpm dev` and `pnpm backfill` write to production and need cloudflare credentials.

```sh
pnpm dev         # site falls back to PDS when D1 is empty — no backfill needed
pnpm backfill    # populates local D1 via contrail; needed only for /xrpc/* paths and the UpdatedBlentos card
```

`pnpm backfill` is resumable, takes a few minutes the first time.

## Before opening a PR

- `pnpm check` — must complete with 0 errors and 0 warnings (existing baseline excepted).
- `pnpm format` — runs eslint --fix + prettier --write across the project.

## Subpages

In-progress changes go on a subpage so your live profile stays clean: `/your.handle/p/<page>/edit` (any `<page>` other than `edit` or `api`). Login redirects to the main page — navigate to the subpage URL manually.

## AI-assisted PRs

Welcome — please:

- Keep diffs minimal; no unrelated cleanup or verbose code
- Test light/dark, colored cards, edit/view, desktop and both mobile modes (screen-size and `pointer: coarse`)
