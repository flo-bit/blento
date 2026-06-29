export function normalizeFeedUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url.trim());
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
		return parsed.toString();
	} catch {
		return undefined;
	}
}

export default normalizeFeedUrl;
