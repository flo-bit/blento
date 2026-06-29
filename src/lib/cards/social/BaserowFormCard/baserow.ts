// Validate that a URL is a Baserow form share link.
// Baserow form share URLs are hosted on baserow.io with a `/form/<slug>`
// path. We scope to the baserow.io host (self-hosted instances are not
// supported yet) so this stays a Baserow form card and doesn't claim
// arbitrary `/form/` URLs from other sites.
export function parseBaserowFormUrl(input: string): string | null {
	let url: URL;
	try {
		url = new URL(input.trim());
	} catch {
		return null;
	}

	if (url.protocol !== 'https:') return null;
	if (url.hostname !== 'baserow.io' && url.hostname !== 'www.baserow.io') return null;
	if (!/^\/form\/[^/]+/.test(url.pathname)) return null;

	return url.toString();
}
