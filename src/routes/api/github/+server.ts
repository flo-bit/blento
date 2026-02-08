import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GitHubContributionsData } from '$lib/cards/social/GitHubProfileCard/types';
import { createCache } from '$lib/cache';

const GithubAPIURL = 'https://edge-function-github-contribution.vercel.app/api/github-data?user=';

export const GET: RequestHandler = async ({ url, platform }) => {
	const user = url.searchParams.get('user');

	if (!user) {
		return json({ error: 'No user provided' }, { status: 400 });
	}

	const cache = createCache(platform);
	const cachedData = await cache?.get('github', user);

	if (cachedData) {
		return json(JSON.parse(cachedData));
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

		await cache?.put('github', user, JSON.stringify(result));

		return json(result);
	} catch (error) {
		console.error('Error fetching GitHub contributions:', error);
		return json({ error: 'Failed to fetch GitHub data' }, { status: 500 });
	}
};
