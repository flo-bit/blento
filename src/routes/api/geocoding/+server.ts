import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const q = url.searchParams.get('q');
	if (!q) {
		return json({ error: 'No search provided' }, { status: 400 });
	}

	const nomUrl =
		'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q);
	console.log(url);

	try {
		const data = await fetch(nomUrl);
		console.error(data.status, data.statusText);
		const location = await data.json();

		return json(location[0]);
	} catch (error) {
		console.error('Error fetching location:', nomUrl, error);
		return json({ error: 'Failed to fetch location' }, { status: 500 });
	}
}
