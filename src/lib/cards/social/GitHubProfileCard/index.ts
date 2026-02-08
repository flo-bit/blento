import type { CardDefinition } from '../../types';
import CreateGitHubProfileCardModal from './CreateGitHubProfileCardModal.svelte';
import GitHubProfileCard from './GitHubProfileCard.svelte';
import type { GitHubContributionsData } from './types';
import { fetchGitHubContributions } from './api.remote';

export type GithubProfileLoadedData = Record<string, GitHubContributionsData | undefined>;

export const GithubProfileCardDefitition = {
	type: 'githubProfile',
	contentComponent: GitHubProfileCard,
	creationModalComponent: CreateGitHubProfileCardModal,

	loadData: async (items) => {
		const githubData: Record<string, GitHubContributionsData> = {};
		for (const item of items) {
			const user = item.cardData.user;
			if (!user) continue;
			try {
				const data = await fetchGitHubContributions(user);
				if (data) githubData[user] = data;
			} catch (error) {
				console.error('Failed to fetch GitHub contributions:', error);
			}
		}
		return githubData;
	},
	loadDataServer: async (items) => {
		const githubData: Record<string, GitHubContributionsData> = {};
		for (const item of items) {
			const user = item.cardData.user;
			if (!user) continue;
			try {
				const data = await fetchGitHubContributions(user);
				if (data) githubData[user] = data;
			} catch (error) {
				console.error('Failed to fetch GitHub contributions:', error);
			}
		}
		return githubData;
	},
	onUrlHandler: (url, item) => {
		const username = getGitHubUsername(url);

		if (!username) return;

		item.cardData.href = url;
		item.cardData.user = username;

		item.w = 6;
		item.mobileW = 8;
		item.h = 3;
		item.mobileH = 6;
		return item;
	},
	urlHandlerPriority: 5,
	minH: 2,
	minW: 2,

	canChange: (item) => Boolean(getGitHubUsername(item.cardData.href)),
	change: (item) => {
		item.cardData.user = getGitHubUsername(item.cardData.href);

		return item;
	},
	name: 'Github Profile',

	keywords: ['developer', 'code', 'repos', 'contributions'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>`
} as CardDefinition & { type: 'githubProfile' };

function getGitHubUsername(url: string | undefined): string | undefined {
	if (!url) return;

	try {
		const parsed = new URL(url);

		// Must be github.com (optionally with www.)
		if (!/^(www\.)?github\.com$/.test(parsed.hostname)) {
			return undefined;
		}

		// Remove empty segments
		const segments = parsed.pathname.split('/').filter(Boolean);

		// Profile URLs have exactly one path segment: /username
		if (segments.length !== 1) {
			return undefined;
		}

		const username = segments[0];

		// GitHub username rules (simplified but accurate)
		// - Alphanumeric or hyphens
		// - Cannot start or end with a hyphen
		// - Max length 39
		if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)) {
			return undefined;
		}

		return username;
	} catch {
		// Invalid URL
		return undefined;
	}
}
