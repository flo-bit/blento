import { json } from '@sveltejs/kit';

export async function GET({ url, locals }) {
	if (!locals.did) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const username = url.searchParams.get('username');
	if (!username) {
		return json({ error: 'No username provided' }, { status: 400 });
	}

	const requestUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

	try {
		const response = await fetch(requestUrl, {
			headers: {
				'User-Agent':
					'Instagram 76.0.0.15.395 Android (24/7.0; 640dpi; 1440x2560; samsung; SM-G930F; herolte; samsungexynos8890; en_US; 138226743)',
				Origin: 'https://www.instagram.com',
				Referer: 'https://www.instagram.com/'
			}
		});

		if (!response.ok) {
			return json(
				{ error: 'Failed to fetch Instagram profile', status: response.status },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json({ follower_count: data['data']['user']['edge_followed_by']['count'] });
	} catch (error) {
		console.error('Error fetching Instagram profile:', error);
		return json({ error: 'Failed to fetch Instagram profile' }, { status: 500 });
	}
}
