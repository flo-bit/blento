// Read-only account warning report. No writes, deployment, rendering, or per-request accounting.
import { execFileSync } from 'node:child_process';
import { cloudflareToken, workerTarget } from './cloudflare-auth.mjs';

const { account, worker } = await workerTarget();
const end = new Date();
end.setUTCHours(0, 0, 0, 0);
const days = 3;
const start = new Date(end.getTime() - days * 86400000);
const body = {
	queryId: 'cost-warning-report',
	view: 'calculations',
	ignoreSeries: true,
	limit: 100,
	timeframe: { from: start.getTime(), to: end.getTime() },
	parameters: {
		datasets: ['cloudflare-workers'],
		filters: [{ key: '$metadata.type', operation: 'eq', type: 'string', value: 'cf-worker-event' }],
		calculations: [
			{ operator: 'count', alias: 'invocations' },
			{ operator: 'sum', key: '$workers.cpuTimeMs', alias: 'cpuMs' }
		],
		groupBys: [{ type: 'string', value: '$metadata.service' }],
		limit: 100
	}
};
const analytics = JSON.parse(
	execFileSync('cf', ['o11y', 'telemetry', 'query', '--body', JSON.stringify(body)], {
		encoding: 'utf8',
		env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: account },
		timeout: 60000
	})
);
const count = analytics.calculations?.find((c) => c.alias === 'invocations')?.aggregates;
const cpu = analytics.calculations?.find((c) => c.alias === 'cpuMs')?.aggregates;
if (!count || !cpu)
	throw new Error('Worker analytics unavailable; do not interpret missing data as zero usage');
const totals = {
	projectedInvocations: Math.round((count.reduce((sum, row) => sum + row.value, 0) * 31) / days),
	projectedCpuMs: Math.round((cpu.reduce((sum, row) => sum + row.value, 0) * 31) / days)
};
console.log(`Complete UTC days: ${start.toISOString()} through ${end.toISOString()} (exclusive)`);
console.log('31-day account projections (sampled analytics, NOT billing reconciliation):', totals);
console.log(
	`${worker} projected CPU-ms:`,
	Math.round(((cpu.find((row) => row.groupKey === worker)?.value ?? 0) * 31) / days)
);

// GraphQL storage snapshots work even where the newer SQL states.kvStorage backend returns 503.
const token = await cloudflareToken();
const storageStart = new Date(end.getTime() - 86400000).toISOString();
const query = `query { viewer { accounts(filter: {accountTag: "${account}"}) {
  kvStorageAdaptiveGroups(limit: 1000, filter: {datetime_geq: "${storageStart}", datetime_lt: "${end.toISOString()}"}) {
    dimensions {namespaceId} max {byteCount keyCount}
  }
}}}`;
const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
	method: 'POST',
	headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
	body: JSON.stringify({ query }),
	signal: AbortSignal.timeout(30000)
});
const storage = await response.json();
const namespaces = storage.data?.viewer?.accounts?.[0]?.kvStorageAdaptiveGroups;
if (!response.ok || storage.errors?.length || !namespaces?.length)
	throw new Error('KV analytics unavailable; inspect the dashboard before declaring storage safe');
const kvBytes = namespaces.reduce((sum, row) => sum + row.max.byteCount, 0);
console.log('KV namespace peak bytes summed over the last complete day:', kvBytes);
let warned = false;
for (const [meter, value, threshold] of [
	['CPU-ms projected / 31 days', totals.projectedCpuMs, 24000000],
	['Invocations projected / 31 days', totals.projectedInvocations, 8000000],
	['KV stored bytes', kvBytes, 800000000]
]) {
	if (value >= threshold) {
		warned = true;
		console.warn(`WARNING: ${meter}: ${value} >= ${threshold}`);
	}
}
console.log(
	'Invocations may include scheduled/internal calls with different billing treatment. Snapshot peaks are not invoice GB-months. Alerts are not spending caps.'
);
if (warned && process.argv.includes('--fail-on-warning')) process.exitCode = 1;
