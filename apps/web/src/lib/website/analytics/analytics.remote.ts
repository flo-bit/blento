import { query, getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import type { Did } from '@atcute/lexicons';

const DATASET = 'blento_pageviews';

export type AnalyticsBreakdownEntry = { label: string; views: number };

export type AnalyticsSummary = {
	/** Whether analytics are available (credentials configured + query succeeded). */
	available: boolean;
	day: number;
	week: number;
	month: number;
	topPages: AnalyticsBreakdownEntry[];
	topReferrers: AnalyticsBreakdownEntry[];
	topCountries: AnalyticsBreakdownEntry[];
};

const EMPTY: AnalyticsSummary = {
	available: false,
	day: 0,
	week: 0,
	month: 0,
	topPages: [],
	topReferrers: [],
	topCountries: []
};

// DIDs only ever contain these characters — reject anything else so we can
// safely interpolate the value into the SQL string.
const DID_PATTERN = /^did:[a-z]+:[a-zA-Z0-9._:%-]+$/;

type SqlRow = Record<string, string | number | null>;

async function runQuery(
	accountId: string,
	apiToken: string,
	sql: string
): Promise<SqlRow[] | null> {
	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiToken}`,
				'Content-Type': 'text/plain'
			},
			body: sql
		}
	);

	if (!response.ok) {
		console.error('Analytics Engine query failed', response.status, await response.text());
		return null;
	}

	const result = (await response.json()) as { data?: SqlRow[] };
	return result.data ?? [];
}

function num(value: string | number | null | undefined): number {
	const n = typeof value === 'number' ? value : Number(value ?? 0);
	return Number.isFinite(n) ? Math.round(n) : 0;
}

function toBreakdown(rows: SqlRow[] | null, labelKey: string): AnalyticsBreakdownEntry[] {
	if (!rows) return [];
	return rows
		.map((row) => ({ label: String(row[labelKey] ?? ''), views: num(row.views) }))
		.filter((entry) => entry.label !== '' && entry.views > 0);
}

/**
 * Returns pageview stats for the currently logged-in user's own site.
 *
 * Page views are written to the `blento_pageviews` Analytics Engine dataset
 * (see `src/lib/helpers/analytics.ts`), indexed by DID. We always scope the
 * query to `locals.did`, so a user can only ever see their own numbers.
 */
export const getMyAnalytics = query(async (): Promise<AnalyticsSummary> => {
	const { locals } = getRequestEvent();
	const did = locals.did;
	if (!did || !DID_PATTERN.test(did)) return EMPTY;

	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const apiToken = env.CLOUDFLARE_API_TOKEN;
	if (!accountId || !apiToken) return EMPTY;

	const where = `index1 = '${did as Did}' AND timestamp >= NOW() - INTERVAL '30' DAY`;

	const totalsSql = `
		SELECT
			SUM(IF(timestamp >= NOW() - INTERVAL '1' DAY, _sample_interval, 0)) AS day,
			SUM(IF(timestamp >= NOW() - INTERVAL '7' DAY, _sample_interval, 0)) AS week,
			SUM(_sample_interval) AS month
		FROM ${DATASET}
		WHERE ${where}`;

	const breakdownSql = (column: string, extra = '') => `
		SELECT ${column} AS label, SUM(_sample_interval) AS views
		FROM ${DATASET}
		WHERE ${where}${extra}
		GROUP BY label
		ORDER BY views DESC
		LIMIT 10`;

	try {
		const [totals, pages, referrers, countries] = await Promise.all([
			runQuery(accountId, apiToken, totalsSql),
			runQuery(accountId, apiToken, breakdownSql('blob3')),
			runQuery(accountId, apiToken, breakdownSql('blob5', " AND blob5 != ''")),
			runQuery(accountId, apiToken, breakdownSql('blob4', " AND blob4 != ''"))
		]);

		// A hard failure (bad credentials / missing dataset) returns null for the
		// totals query — surface that as "unavailable" rather than "0 views".
		if (totals === null) return EMPTY;

		const row = totals[0] ?? {};
		return {
			available: true,
			day: num(row.day),
			week: num(row.week),
			month: num(row.month),
			topPages: toBreakdown(pages, 'label'),
			topReferrers: toBreakdown(referrers, 'label'),
			topCountries: toBreakdown(countries, 'label')
		};
	} catch (err) {
		console.error('getMyAnalytics failed', err);
		return EMPTY;
	}
});
