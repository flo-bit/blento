# blento

public beta version can be tried at https://blento.app

Your personal website in a bento style layout, using your atproto personal data server (the tech that bluesky runs on) as a backend.

made with svelte, tailwind and hosted on cloudflare workers.

https://github.com/user-attachments/assets/2b6f5e99-b5d4-4484-ab95-35445067bb80

## Why?

This started as a replacement/alternative for bento.me which is shutting down in a few weeks (Feb 2026) after being bought by a competitor ^^ I wanted to build a version that couldn't just shut down or where it would be very easy to spin up a new version (with all the data) should the old one disappear.

That's why all your data is saved on your atproto personal data server, so you can start setting up your website on blento.app, but then anytime you want to start self hosting you easily take your data with you (dedicated forks optimized for self hosting on different platforms on the roadmap).

Should blento.app shut down at some point, someone else can also spin up a new version that shows all blentos (note: it's MIT licensed so you _could_ do that now too and offer a competing service, but please don't (except for self-hosting your own profile ofc), legal != nice).

One other note: for most independence I encourage everyone to get their own domain see [how to setup a custom domain](./docs/CustomDomain.md), selfhosting on the other hand while currently possible is not encourage _yet_ before this project reaches a more stable state (if you do want to selfhost though, see [here](./docs/Selfhosting.md)).

## Making Custom cards

See [docs/CustomCards](./docs/CustomCards.md)

## Contributing

Contributions are very welcome, see [docs/Contributing](./docs/Contributing.md) for more info.

## Idea for a card?

Open an issue, see [here](https://github.com/flo-bit/blento/issues/93) for card ideas that are already planned.

## License

MIT
