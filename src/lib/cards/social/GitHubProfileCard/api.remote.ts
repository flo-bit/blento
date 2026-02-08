import { query, getRequestEvent } from '$app/server';
import { createCache } from '$lib/cache';

const GITHUB_API_URL = 'https://edge-function-github-contribution.vercel.app/api/github-data?user=';

export const fetchGitHubContributions = query('unchecked', async (user: string) => {
	const { platform } = getRequestEvent();
	const cache = createCache(platform);

	const cached = await cache?.get('github', user);
	if (cached) return JSON.parse(cached);

	const response = await fetch(GITHUB_API_URL + encodeURIComponent(user));
	if (!response.ok) return undefined;

	const data = await response.json();
	if (!data?.user) return undefined;

	await cache?.put('github', user, JSON.stringify(data.user));
	return data.user;
});
