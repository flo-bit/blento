import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCache } from '$lib/cache';

const GithubContributorsAPIURL =
	'https://edge-function-github-contribution.vercel.app/api/github-contributors';

export const GET: RequestHandler = async ({ url, platform }) => {
	const owner = url.searchParams.get('owner');
	const repo = url.searchParams.get('repo');

	if (!owner || !repo) {
		return json({ error: 'Missing owner or repo parameter' }, { status: 400 });
	}

	const cache = createCache(platform);
	const cacheKey = `${owner}/${repo}`;
	const cachedData = await cache?.get('gh-contrib', cacheKey);

	if (cachedData) {
		return json(JSON.parse(cachedData));
	}

	try {
		const response = await fetch(
			`${GithubContributorsAPIURL}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
		);

		if (!response.ok) {
			return json(
				{ error: 'Failed to fetch GitHub contributors ' + response.statusText },
				{ status: response.status }
			);
		}

		const data = await response.json();

		await cache?.put('gh-contrib', cacheKey, JSON.stringify(data));

		return json(data);
	} catch (error) {
		console.error('Error fetching GitHub contributors:', error);
		return json({ error: 'Failed to fetch GitHub contributors' }, { status: 500 });
	}
};
