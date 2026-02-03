# Contributing Guidelines

For creating new cards see [here](CustomCards.md) (and check out [existing card ideas](CardIdeas.md))

## Development

```
git clone https://github.com/flo-bit/blento.git
cd blento
cp .env.example .env
pnpm install
pnpm run dev
```

## AI assisted development

You can submit PRs written with AI assistance but please make sure:

- there's no extra unnecessary changes/unnecessary verbose code (keep it simple)
- you test everything yourself
  - in light/dark mode
  - with and without colored cards
  - in edit mode and not in edit mode
  - on mobile and desktop (note that there's two different mobile "modes", one dependent on screen size and one enabled when pointer: coarse)

## Subpages

currently subpages exist but are not used yet, they are perfect for testing things though (as otherwise your profile on blento.app will show e.g. cards that dont exist on the deployed version yet), in the development verion go to `/your.handle/{pagename}/edit` to edit a subpage (where pagename can be any string that is not "edit" or "api") (note that currently when you login you always get redirected to your main page)
