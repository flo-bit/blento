import { json } from '@sveltejs/kit';
import { getLinkPreview } from 'link-preview-js';
import { parseSafeUrl } from '$lib/ssrf';

export async function GET({ url, locals }) {
	if (!locals.did) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const link = url.searchParams.get('link');
	if (!link) {
		return json({ error: 'No link provided' }, { status: 400 });
	}

	try {
		parseSafeUrl(link);
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'Invalid URL' }, { status: 400 });
	}

	try {
		const data = await getLinkPreview(link, {
			followRedirects: `manual`,
			handleRedirects: (baseURL: string, forwardedURL: string) => {
				try {
					parseSafeUrl(forwardedURL);
				} catch {
					return false;
				}
				const urlObj = new URL(baseURL);
				const forwardedURLObj = new URL(forwardedURL);
				return (
					forwardedURLObj.hostname === urlObj.hostname ||
					forwardedURLObj.hostname === 'www.' + urlObj.hostname ||
					'www.' + forwardedURLObj.hostname === urlObj.hostname
				);
			}
		});
		return json(data);
	} catch (error) {
		console.error('Error fetching link preview:', error);
		return json({ error: 'Failed to fetch link preview' }, { status: 500 });
	}
}
