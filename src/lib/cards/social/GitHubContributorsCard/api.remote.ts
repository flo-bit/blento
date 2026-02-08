import { query, getRequestEvent } from '$app/server';
import { createCache } from '$lib/cache';

const GITHUB_CONTRIBUTORS_API_URL =
	'https://edge-function-github-contribution.vercel.app/api/github-contributors';

export const fetchGitHubContributors = query(
	'unchecked',
	async ({ owner, repo }: { owner: string; repo: string }) => {
		const { platform } = getRequestEvent();
		const cache = createCache(platform);

		const key = `${owner}/${repo}`;
		const cached = await cache?.get('gh-contrib', key);
		if (cached) return JSON.parse(cached);

		const response = await fetch(
			`${GITHUB_CONTRIBUTORS_API_URL}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
		);
		if (!response.ok) return undefined;

		const data = await response.json();
		await cache?.put('gh-contrib', key, JSON.stringify(data));
		return data;
	}
);
