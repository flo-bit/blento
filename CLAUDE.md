# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blento is a Bluesky-powered customizable bento grid website builder. Users authenticate via ATProto OAuth and create draggable/resizable cards stored in their Bluesky PDS (Personal Data Server) using the `app.blento.card` collection.

## Commands

- `pnpm dev` - Start development server (Vite)
- `pnpm build` - Build for production
- `pnpm preview` - Build and preview with Wrangler (Cloudflare Workers)
- `pnpm check` - Run svelte-check for type checking
- `pnpm lint` - Run Prettier check and ESLint
- `pnpm format` - Format code with Prettier
- `pnpm deploy` - Build and deploy to Cloudflare Workers

## Code Quality Requirements

Before submitting changes:

1. **Run `pnpm check`** - Must complete with 0 errors and 0 warnings
2. **Run `pnpm format`** - Format all code with Prettier

## Architecture

### Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5 (using runes: `$state`, `$derived`, `$props`)
- **Styling**: Tailwind CSS 4 with container queries (`@container`)
- **Deployment**: Cloudflare Workers via `@sveltejs/adapter-cloudflare`
- **UI Components**: `@foxui/core`, `@foxui/social` (custom component libraries)

### Grid System

The site uses an 8-column grid layout (`COLUMNS = 8` in `src/lib/index.ts`). Each card has:

- Desktop position/size: `x`, `y`, `w`, `h`
- Mobile position/size: `mobileX`, `mobileY`, `mobileW`, `mobileH`

Grid margins: 16px desktop, 12px mobile.

### Key Components

**Website Rendering:**

- `src/lib/website/Website.svelte` - Read-only view of a user's bento grid
- `src/lib/website/EditableWebsite.svelte` - Full editing interface with drag-and-drop, card creation, and save functionality
- `src/lib/website/Settings.svelte` and `src/lib/website/Profile.svelte` - Editing panels and profile UI
- Styling: two colors: base color (one the gray-ish tailwind colors: `gray`, `neutral`, `stone`, ...) and accent color (one of the not-gray-ish tailwind color: `rose`, `red`, `amber`, ...)

**Card System (`src/lib/cards/`):**

- `CardDefinition` type in `types.ts` defines the interface for card types
- Each card type exports a definition with: `type`, `contentComponent`, optional `editingContentComponent`, `creationModalComponent`, `sidebarButtonText`, `loadData`, `loadDataServer`, `upload` (see more info and description in `src/lib/cards/types.ts`)
- `loadData` fetches external data on the client (via remote functions). `loadDataServer` is the server-side equivalent used during SSR to avoid self-referential HTTP requests on Cloudflare Workers.
- Cards that need external data use `.remote.ts` files (SvelteKit remote functions) co-located in the card folder (e.g. `GitHubProfileCard/api.remote.ts`, `LastFMCard/api.remote.ts`). These use `query()` from `$app/server` and run server-side, with SvelteKit generating fetch wrappers for client use.
- Card types include Text, Link, Image, Bluesky, Embed, Map, Livestream, ATProto collections, and special cards (see `src/lib/cards`).
- `AllCardDefinitions` and `CardDefinitionsByType` in `index.ts` aggregate all card types
- See e.g. `src/lib/cards/EmbedCard/` and `src/lib/cards/LivestreamCard/` for examples of implementation.
- Cards should be styled to work in light and dark mode (with `dark:` class modifier) as well as when cards are colorful (= bg-color-500 for the card background) (with `accent:` modifier).

**ATProto Integration (`src/lib/oauth/`):**

- `auth.svelte.ts` - OAuth client state and login/logout flow using `@atcute/oauth-browser-client`
- `atproto.ts` - ATProto API helpers: `resolveHandle`, `listRecords`, `getRecord`, `putRecord`, `deleteRecord`, `uploadImage`
- Data is stored in user's PDS under collection `app.blento.card`
- **Important**: ATProto does not allow floating point numbers in records. All numeric values must be integers.

**Caching (`src/lib/cache.ts`):**

- `CacheService` class wraps a single Cloudflare KV namespace (`USER_DATA_CACHE`) with namespaced keys
- Keys are stored as `namespace:key` (e.g. `blento:did:plc:abc`, `github:someuser`, `lastfm:method:user:period:limit`)
- Per-namespace default TTLs via KV `expirationTtl`: `blento` (24h), `identity` (7d), `github` (12h), `gh-contrib` (12h), `lastfm` (1h, overridable), `npmx` (12h), `meta` (no expiry)
- Blento data is keyed by DID with bidirectional handle↔DID identity mappings (`identity:h:{handle}` → DID, `identity:d:{did}` → handle)
- `getBlento(identifier)` accepts either a handle or DID and resolves automatically
- `putBlento(did, handle, data)` writes data + both identity mappings
- Generic `get(namespace, key)` / `put(namespace, key, value, ttl?)` and JSON variants `getJSON` / `putJSON` for all namespaces
- `createCache(platform)` factory function creates a `CacheService` from `platform.env`
- `CUSTOM_DOMAINS` KV namespace is separate and accessed directly for custom domain → DID resolution

**Data Loading (`src/lib/website/`):**

- `load.ts` - Fetches user data from their PDS, with optional caching via `CacheService`
- `data.ts` - Defines which collections/records to fetch
- `context.ts` - Svelte contexts for passing DID, handle, and data down the component tree

### Routes

- `/` - Landing page
- `/[handle]/[[page]]` - View a user's bento site (loads from their PDS)
- `/[handle]/[[page]]/edit` - Edit mode for a user's site page
- `/edit` - Self-hosted edit mode
- `/api/links` - Link preview API
- `/api/geocoding` - Geocoding API for map cards
- `/api/reloadRecent`, `/api/update` - Additional data endpoints

### Item Type

Cards are represented by the `Item` type (`src/lib/types.ts`) with grid position, size, cardType, and cardData properties.

### Collision/Layout Helpers

`src/lib/helper.ts` contains grid layout algorithms:

- `fixAllCollisions` - Push cards down when they overlap
- `compactItems` - Move cards up to fill gaps
- `simulateFinalPosition` - Preview where a dragged card will land
