import { json } from '@sveltejs/kit';
import { verifyDomainDns } from '$lib/dns';

const EXPECTED_TARGET = 'blento-proxy.fly.dev';

export async function POST({ request }) {
	let body: { domain: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { domain } = body;

	if (!domain) {
		return json({ error: 'Missing required field: domain' }, { status: 400 });
	}

	// Validate domain format
	if (
		!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(
			domain
		)
	) {
		return json({ error: 'Invalid domain format' }, { status: 400 });
	}

	// Verify DNS by querying authoritative nameservers directly.
	// This gives instant, accurate results instead of relying on cached resolvers.
	// Checks CNAME for subdomains and A records for root/apex domains.
	// See: https://jacob.gold/posts/stop-telling-users-their-dns-is-wrong/
	try {
		const result = await verifyDomainDns(domain, EXPECTED_TARGET);
		if (!result.ok) {
			return json({ error: result.error, hint: result.hint }, { status: 400 });
		}
	} catch {
		return json({ error: 'Failed to verify DNS records.' }, { status: 500 });
	}

	return json({ success: true });
}
