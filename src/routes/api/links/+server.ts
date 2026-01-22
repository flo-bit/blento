import { json } from '@sveltejs/kit';
import { getLinkPreview } from 'link-preview-js';

export async function GET({ url }) {
	const link = url.searchParams.get('link');
	if (!link) {
		return json({ error: 'No link provided' }, { status: 400 });
	}

	// check if link is valid url
	try {
		new URL(link);
	} catch (_) {
		return json({ error: 'Link is not a valid url' }, { status: 500 });
	}

	try {
		const data = await getLinkPreview(link, {
			followRedirects: `manual`,
			handleRedirects: (baseURL: string, forwardedURL: string) => {
				const urlObj = new URL(baseURL);
				const forwardedURLObj = new URL(forwardedURL);
				if (
					forwardedURLObj.hostname === urlObj.hostname ||
					forwardedURLObj.hostname === 'www.' + urlObj.hostname ||
					'www.' + forwardedURLObj.hostname === urlObj.hostname
				) {
					return true;
				} else {
					return false;
				}
			}
		});
		return json(data);
	} catch (error) {
		console.error('Error fetching link preview:', error);
		return json({ error: 'Failed to fetch link preview' }, { status: 500 });
	}
}
