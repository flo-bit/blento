import { error } from '@sveltejs/kit';

export async function GET({ url }) {
	const imageUrl = url.searchParams.get('url');
	if (!imageUrl) {
		throw error(400, 'No URL provided');
	}

	try {
		new URL(imageUrl);
	} catch {
		throw error(400, 'Invalid URL');
	}

	try {
		const response = await fetch(imageUrl);

		if (!response.ok) {
			throw error(response.status, 'Failed to fetch image');
		}

		const contentType = response.headers.get('content-type');

		// Only allow image content types
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
