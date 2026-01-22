# blento

Alpha version can be tried at https://blento.app

Your personal website in a bento style layout, using your bluesky personal data server as a backend.

made with svelte, tailwind and hosted on cloudflare workers.

https://github.com/user-attachments/assets/2b6f5e99-b5d4-4484-ab95-35445067bb80

## Why?

This started as a replacement/alternative for bento.me which is shutting down in a few weeks (Feb 2026) after being bought by a competitor ^^ I wanted to build a version that couldn't just shut down or where it would be very easy to spin up a new version (with all the data) should the old one disappear.

That's why all your data is saved on your bluesky personal data server, so you can start setting up your website on blento.app, but then anytime you want to start self hosting you easily take your data with you (dedicated forks optimized for self hosting on different platforms coming soon).

Should blento.app shut down at some point, someone else can also spin up a new version that shows all blentos (note: it's MIT licensed so you _could_ do that now too and offer a competing service, but please don't (except for self-hosting your own profile ofc), legal != nice).

One other note: for most independence I encourage everyone to get their own domain and either self host or redirect to blento.app/your-profile (still working on a way to make this as easy as possible for non-technical users, if you have any suggestions please reach out).

## Selfhosting

See [docs/Selfhosting](./docs/Selfhosting.md).

## Making Custom cards

See [docs/CustomCards](./docs/CustomCards.md)

## Contributing

See [docs/Contributing](./docs/Contributing.md)

## Idea for a card?

Open an issue

## License

MIT
