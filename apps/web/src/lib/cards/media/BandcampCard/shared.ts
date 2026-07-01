// Bandcamp's EmbeddedPlayer resolves a public album/track URL server-side via
// its `url=` param, so no scraping/ID lookup is needed (same approach as the
// first-party bluesky social-app embed player).

// Match bandcamp.com subdomain stores only (matching bluesky's behavior).
// Custom domains are intentionally excluded to avoid hijacking unrelated
// `/album/` or `/track/` URLs.
const BANDCAMP_HOST = /^[a-z\d][a-z\d-]{2,}[a-z\d]\.bandcamp\.com$/i;

export function isBandcampUrl(url: string | undefined): boolean {
	if (!url) return false;
	try {
		const u = new URL(url);
		if (!BANDCAMP_HOST.test(u.hostname)) return false;
		const kind = u.pathname.split('/')[1];
		return kind === 'album' || kind === 'track';
	} catch {
		return false;
	}
}

export function bandcampPlayerUri(url: string): string {
	return `https://bandcamp.com/EmbeddedPlayer/url=${encodeURIComponent(
		url
	)}/size=large/bgcol=333333/linkcol=0f91ff/tracklist=true/transparent=true/`;
}
