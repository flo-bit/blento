# External data sources for sections

Allow sections to be auto-filled from external data (e.g. Grain gallery photos, standard.site blog posts) instead of manually curated cards.

## Goals

- Sections can pull items from external sources (ATProto collections, web APIs, etc.) without the user manually creating each card.
- Extension path mirrors the existing card `loadData` pattern so there's one consistent idea in the codebase.
- A section can always fall back to manual content (same UX as today).
- Multiple sections on a page can use different sources; a single page can mix sourced and manual sections.

## Proposed API

### SectionDefinition additions

```ts
type SectionDefinition = {
	// existing...

	// Optional external data fetch. Result stored in WebsiteData.additionalData[section.id].
	loadData?: (section: SectionRecord, ctx: { did; handle; cache? }) => Promise<unknown>;
	loadDataServer?: (
		section: SectionRecord,
		ctx: { did; handle; cache?; env?; platform? }
	) => Promise<unknown>;
};
```

Mirrors the card-level `loadData`/`loadDataServer`. Reuses the same cache service + KV infrastructure.

### sectionData shape

Each section that supports sourcing stores its source config in `sectionData`:

```ts
// Manual (default)
sectionData: { source: { provider: 'manual' }, ...otherStuff }

// Sourced from Grain
sectionData: {
  source: { provider: 'grain-gallery', galleryUri: 'at://did:.../xyz.grain.photo.gallery/abc' }
}

// Sourced from standard.site blog
sectionData: {
  source: { provider: 'standard-site-blog', did: 'did:...', limit: 10 }
}
```

### Source registration

Sources are pluggable modules that can be used by one or more section types:

```ts
// src/lib/sections/sources/types.ts
type SectionSource = {
	id: string; // e.g. 'grain-gallery'
	name: string; // user-facing name
	supportedSections: string[]; // e.g. ['gallery']
	configComponent: Component<{
		config: any;
		onchange: (next: any) => void;
	}>;
	loadData?: (config: any, ctx: any) => Promise<unknown>;
	loadDataServer?: (config: any, ctx: any) => Promise<unknown>;
};
```

Registered in a central `AllSectionSources` array like cards/sections are. Section types query the list filtered by `supportedSections`.

Example: `src/lib/sections/sources/grain-gallery.ts` registers a source with `supportedSections: ['gallery']` and a `loadDataServer` that fetches photos via the Grain lexicon.

### Rendering flow

The section's `contentComponent` receives:

- `items` (manual cards assigned to the section, as today)
- `externalData` (from `additionalData[section.id]`)

If `sectionData.source.provider !== 'manual'`, the section renders from `externalData`; otherwise it renders `items`. Optionally, a section could combine both (e.g. pinned manual items + auto-pulled items).

External items are "synthetic": they look like `Item`s at the render layer (enough for `BaseCard` / `Card` to render them) but they have no PDS record and no `sectionId`. They reuse existing card types — a Grain photo renders as a synthetic `image` card, a blog post as a synthetic `link` card. No new card components needed.

### Editing UX

- Section settings popover/drawer gets a **Source** dropdown listing compatible sources (derived from `AllSectionSources` filtered to the current section type)
- When the source is non-manual, the inline card-editing UI is replaced with the source's `configComponent` (e.g. "Paste Grain gallery URI")
- Switching source back to "Manual" restores the manual editing UX (and the existing cards resurface)
- The source's config is persisted in `sectionData.source`

## Implementation order

1. Add `loadData` / `loadDataServer` to `SectionDefinition` and wire into `load.ts` (server-side fan-out like cards already do).
2. Add the sources registry (`src/lib/sections/sources/index.ts`).
3. Teach `contentComponent` / `editingContentComponent` to branch on `sectionData.source.provider`.
4. Build one real source end-to-end: **Grain gallery → Gallery section** (infrastructure already exists in `PhotoGalleryCard`).
5. Follow with: **standard.site blog → Row section** (requires a blog-post card first, or a synthetic link card with richer metadata).

## Open questions

- Should sources be able to return card-type-specific `cardData`, or should they always return a normalised shape? Probably card-type-specific for flexibility.
- Pagination: do sources need to know about "load more" or infinite scroll? For now assume batch-fetch (limit in config).
- Caching: per-section cache key by `section.id + section.updatedAt`? Or by source config hash so multiple sections with the same source share cache? Probably the latter.
- Mixing sourced + manual: start with mutually exclusive (source OR manual), add mixing later if needed.
- Mobile UX for the Source dropdown and config UI: same treatment as the card editing popovers.
