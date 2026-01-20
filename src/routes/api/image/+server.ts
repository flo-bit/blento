import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const image = url.searchParams.get('image');
	if (!image) {
		return json({ error: 'No image provided' }, { status: 400 });
	}

	return await fetch(image);
}
