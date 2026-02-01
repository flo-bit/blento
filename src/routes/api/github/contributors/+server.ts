import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const GithubContributorsAPIURL =
	'https://edge-function-github-contribution.vercel.app/api/github-contributors';

export const GET: RequestHandler = async ({ url, platform }) => {
	const owner = url.searchParams.get('owner');
	const repo = url.searchParams.get('repo');

	if (!owner || !repo) {
		return json({ error: 'Missing owner or repo parameter' }, { status: 400 });
	}

	const cacheKey = `#github-contributors:${owner}/${repo}`;
	const cachedData = await platform?.env?.USER_DATA_CACHE?.get(cacheKey);

	if (cachedData) {
		const parsedCache = JSON.parse(cachedData);

		const TWELVE_HOURS = 12 * 60 * 60 * 1000;
		const now = Date.now();

		if (now - (parsedCache.updatedAt || 0) < TWELVE_HOURS) {
			return json(parsedCache.data);
		}
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

		await platform?.env?.USER_DATA_CACHE?.put(
			cacheKey,
			JSON.stringify({ data, updatedAt: Date.now() })
		);

		return json(data);
	} catch (error) {
		console.error('Error fetching GitHub contributors:', error);
		return json({ error: 'Failed to fetch GitHub contributors' }, { status: 500 });
	}
};
