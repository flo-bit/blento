# Repository Guidelines

## Project Structure & Module Organization

- `src/routes` contains SvelteKit routes. User-facing pages are under `src/routes/[[actor=actor]]/(pages)/` with an optional actor param (double brackets). When omitted, the actor is resolved from custom domain KV or `PUBLIC_HANDLE`. API endpoints live under `src/routes/api` and `src/routes/[[actor=actor]]/api`.
- `src/lib` holds reusable modules: card implementations in `src/lib/cards`, shared UI in `src/lib/components`, ATProto/OAuth helpers in `src/lib/atproto`, and site data/loading in `src/lib/website`.
- Root app setup lives in `src/app.html` and `src/app.css`.
- `static` is for public assets served as-is.
- `docs` includes contributor-facing docs like custom cards and self-hosting.

## Build, Test, and Development Commands

- `pnpm dev` starts the Vite dev server.
- `pnpm build` creates a production build.
- `pnpm preview` builds and runs locally with Wrangler.
- `pnpm check` runs `svelte-check` for type diagnostics.
- `pnpm lint` runs Prettier check and ESLint.
- `pnpm format` auto-formats the codebase with Prettier.
- `pnpm deploy` builds and deploys to Cloudflare Workers.

## Coding Style & Naming Conventions

- Indentation uses tabs, single quotes, and 100-column width (see `.prettierrc`).
- Svelte components use PascalCase filenames; utilities and helpers use camelCase.
- Prefer TypeScript in `src` and keep module boundaries aligned with `src/lib` subfolders (cards, components, website, oauth).

## Testing Guidelines

- There is no dedicated test runner yet.
- **Before submitting changes, you must:**
  1. Run `pnpm check` - Must complete with **0 errors and 0 warnings**
  2. Run `pnpm format` - Format all code with Prettier
  3. Run `pnpm lint` - Ensure no linting errors
- For UI changes, verify key flows manually (login, card editing, save/load, and route navigation across `[handle]` pages).

## Commit & Pull Request Guidelines

- Keep commits short and direct; recent history favors lowercase, imperative summaries (e.g., `small fixes`).
- PRs should include a clear description, linked issues when relevant, and screenshots for UI changes.

## Configuration & Deployment Notes

- Copy `.env.example` to `.env` and adjust `PUBLIC_*` values for local or self-hosted setups.
- Cloudflare configuration lives in `wrangler.jsonc`; deployments use Wrangler via `pnpm deploy`.
