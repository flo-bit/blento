// Wrangler 4.73 does not expose redact_query_string in its configuration schema.
// Preserve all other settings and apply this field after each deploy until it does.
import { cloudflareToken, workerTarget } from './cloudflare-auth.mjs';

const { account, worker } = await workerTarget();
const token = await cloudflareToken();
const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/workers/scripts/${encodeURIComponent(worker)}/settings`;
const headers = { Authorization: `Bearer ${token}` };
const before = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
const current = await before.json();
if (!before.ok || !current.success) throw new Error(`Settings read failed: HTTP ${before.status}`);
const metadata = new FormData();
metadata.set(
	'settings',
	JSON.stringify({
		observability: { ...current.result.observability, redact_query_string: true }
	})
);
const response = await fetch(url, {
	method: 'PATCH',
	headers,
	body: metadata,
	signal: AbortSignal.timeout(30_000)
});
const result = await response.json();
if (!response.ok || !result.success || !result.result.observability?.redact_query_string) {
	throw new Error(
		`Query-string redaction failed: HTTP ${response.status}; ${JSON.stringify(result.errors ?? [])}`
	);
}
console.log('Worker query-string redaction enabled.');
