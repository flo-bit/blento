<script lang="ts">
	import { getMyAnalytics } from '$lib/website/analytics/analytics.remote';

	const query = getMyAnalytics();

	function fmt(n: number): string {
		return n.toLocaleString();
	}

	// Breakdowns (top pages / referrers / countries) are commented out for now.
	// import { type AnalyticsBreakdownEntry } from '$lib/website/analytics/analytics.remote';
	//
	// function pageLabel(label: string): string {
	// 	return label === 'self' ? 'Home' : label;
	// }
	//
	// function countryLabel(code: string): string {
	// 	if (!/^[A-Za-z]{2}$/.test(code)) return code;
	// 	const flag = String.fromCodePoint(
	// 		...code
	// 			.toUpperCase()
	// 			.split('')
	// 			.map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
	// 	);
	// 	return `${flag} ${code.toUpperCase()}`;
	// }

	const windows = [
		{ key: 'day', label: 'Last 24 hours' },
		{ key: 'week', label: 'Last 7 days' },
		{ key: 'month', label: 'Last 30 days' }
	] as const;
</script>

<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Analytics</h3>
<p class="text-base-500 dark:text-base-400 mt-1 text-sm">
	Page views across your whole site. Only you can see these numbers.
</p>

{#await query}
	<div class="mt-6 grid grid-cols-3 gap-3">
		{#each windows as w (w.key)}
			<div
				class="border-base-200 dark:border-base-800 bg-base-100/50 dark:bg-base-900/50 h-24 animate-pulse rounded-xl border"
			></div>
		{/each}
	</div>
{:then data}
	{#if !data.available}
		<div
			class="border-base-200 dark:border-base-800 text-base-500 dark:text-base-400 mt-6 rounded-xl border p-6 text-center text-sm"
		>
			Analytics aren't available right now. Check back soon.
		</div>
	{:else}
		<div class="mt-6 grid grid-cols-3 gap-3">
			{#each windows as w (w.key)}
				<div class="border-base-200 dark:border-base-800 rounded-xl border p-4">
					<div class="text-base-500 dark:text-base-400 text-xs font-medium">{w.label}</div>
					<div class="text-base-900 dark:text-base-100 mt-1 text-2xl font-bold tabular-nums">
						{fmt(data[w.key])}
					</div>
					<div class="text-base-400 dark:text-base-500 text-xs">views</div>
				</div>
			{/each}
		</div>

		{#if data.month === 0}
			<p class="text-base-500 dark:text-base-400 mt-6 text-sm">
				No visits in the last 30 days yet.
			</p>
		{/if}

		<!--
		Breakdowns (top pages / referrers / countries) are commented out for now.

		{#snippet breakdown(
			title: string,
			entries: AnalyticsBreakdownEntry[],
			format: (s: string) => string
		)}
			{#if entries.length > 0}
				{@const max = entries[0].views}
				<div class="mt-6">
					<h4 class="text-base-700 dark:text-base-300 text-sm font-semibold">{title}</h4>
					<ul class="mt-2 space-y-1">
						{#each entries as entry (entry.label)}
							<li class="relative flex items-center justify-between rounded-lg px-3 py-1.5 text-sm">
								<div
									class="bg-accent-500/10 dark:bg-accent-500/15 absolute inset-y-0 left-0 rounded-lg"
									style="width: {max > 0 ? (entry.views / max) * 100 : 0}%"
								></div>
								<span class="text-base-700 dark:text-base-300 relative truncate pr-2">
									{format(entry.label)}
								</span>
								<span class="text-base-500 dark:text-base-400 relative tabular-nums">
									{fmt(entry.views)}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/snippet}

		{@render breakdown('Top pages', data.topPages, pageLabel)}
		{@render breakdown('Top referrers', data.topReferrers, (s) => s)}
		{@render breakdown('Top countries', data.topCountries, countryLabel)}
		-->
	{/if}
{:catch}
	<div
		class="border-base-200 dark:border-base-800 text-base-500 dark:text-base-400 mt-6 rounded-xl border p-6 text-center text-sm"
	>
		Couldn't load analytics. Please try again later.
	</div>
{/await}
