import { error } from '@sveltejs/kit';
import { parseSafeUrl } from '$lib/ssrf';

export async function GET({ url, locals }) {
	if (!locals.did) {
		throw error(401, 'Not authenticated');
	}

	const imageUrl = url.searchParams.get('url');
	if (!imageUrl) {
		throw error(400, 'No URL provided');
	}

	let target: URL;
	try {
		target = parseSafeUrl(imageUrl);
	} catch (e) {
		throw error(400, e instanceof Error ? e.message : 'Invalid URL');
	}

	try {
		const response = await fetch(target, { redirect: 'follow' });

		if (!response.ok) {
			throw error(response.status, 'Failed to fetch image');
		}

		const contentType = response.headers.get('content-type');

		if (!contentType?.startsWith('image/')) {
			throw error(400, 'URL does not point to an image');
		}

		const blob = await response.blob();

		return new Response(blob, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400'
			}
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Error proxying image:', err);
		throw error(500, 'Failed to proxy image');
	}
}
