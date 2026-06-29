type PageviewEvent = {
	did: string;
	handle: string;
	page: string;
	request: Request;
};

const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview/i;

function refererHost(referer: string | null): string {
	if (!referer) return '';
	try {
		return new URL(referer).hostname;
	} catch {
		return '';
	}
}

export function logPageview(
	platform: App.Platform | undefined,
	{ did, handle, page, request }: PageviewEvent
): void {
	const ae = platform?.env?.ANALYTICS;
	if (!ae) return;

	const ua = request.headers.get('user-agent') ?? '';
	if (BOT_PATTERN.test(ua)) return;

	const country = request.headers.get('cf-ipcountry') ?? '';
	const referer = refererHost(request.headers.get('referer'));

	ae.writeDataPoint({
		indexes: [did],
		blobs: [did, handle, page, country, referer]
	});
}
