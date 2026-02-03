export type GitHubContributionDay = {
	date: string;
	contributionCount: number;
	color: string;
};

export type GitHubContributionWeek = {
	contributionDays: GitHubContributionDay[];
};

export type GitHubContributionsData = {
	login: string;
	avatarUrl: string;
	contributionsCollection: {
		contributionCalendar: {
			totalContributions: number;
			weeks: GitHubContributionWeek[];
		};
	};
	followers: {
		totalCount: number;
	};

	updatedAt: number;
};
