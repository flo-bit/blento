import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GitHubContributionsData } from '$lib/cards/GitHubProfileCard/types';

const GithubAPIURL = 'https://edge-function-github-contribution.vercel.app/api/github-data?user=';

export const GET: RequestHandler = async ({ url, platform }) => {
	const user = url.searchParams.get('user');

	if (!user) {
		return json({ error: 'No user provided' }, { status: 400 });
	}

	const cachedData = await platform?.env?.USER_DATA_CACHE?.get('#github:' + user);

	if (cachedData) {
		const parsedCache = JSON.parse(cachedData);

		const TWELVE_HOURS = 12 * 60 * 60 * 1000;
		const now = Date.now();

		if (now - (parsedCache.updatedAt || 0) < TWELVE_HOURS) {
			return json(parsedCache);
		}
	}

	try {
		const response = await fetch(GithubAPIURL + user);

		if (!response.ok) {
			console.error('error', response.statusText);
			return json(
				{ error: 'Failed to fetch GitHub data ' + response.statusText },
				{ status: response.status }
			);
		}

		const data = await response.json();

		if (!data?.user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const result = data.user as GitHubContributionsData;
		result.updatedAt = Date.now();

		await platform?.env?.USER_DATA_CACHE?.put('#github:' + user, JSON.stringify(result));

		return json(result);
	} catch (error) {
		console.error('Error fetching GitHub contributions:', error);
		return json({ error: 'Failed to fetch GitHub data' }, { status: 500 });
	}
};
