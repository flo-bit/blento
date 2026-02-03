<script lang="ts">
	import { cn } from '@foxui/core';
	import type { GitHubContributionsData } from './types';

	let { data, isBig = false }: { data: GitHubContributionsData; isBig: boolean } = $props();

	let colors: Record<string, string> = {
		'#ebedf0': 'bg-accent-200/50 dark:bg-accent-950/30 accent:bg-accent-800/20',
		'#9be9a8': 'bg-accent-300/50 dark:bg-accent-800/70 accent:bg-accent-800/40',
		'#40c463': 'bg-accent-300 dark:bg-accent-700 accent:bg-accent-800/60',
		'#30a14e': 'bg-accent-400 dark:bg-accent-600 accent:bg-accent-800/80',
		'#216e39': 'bg-accent-500 accent:bg-accent-800'
	};
</script>

<div class={cn('flex h-full w-full justify-end gap-0.5', isBig && 'gap-1')}>
	{#each data.contributionsCollection.contributionCalendar.weeks as week (week.contributionDays)}
		<div class={cn('flex w-full flex-col gap-0.5', isBig && 'gap-1')}>
			{#if week.contributionDays.length === 7}
				{#each week.contributionDays as day (day.date)}
					<div
						class={cn('size-2.5 rounded-sm', colors[day.color], isBig && 'size-3')}
						title="Contributions: {day.contributionCount} on {day.date}"
					></div>
				{/each}
			{/if}
		</div>
	{/each}
</div>
