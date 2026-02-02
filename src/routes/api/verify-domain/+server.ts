import { json } from '@sveltejs/kit';
import type { Did } from '@atcute/lexicons';
import { getClient, getRecord } from '$lib/atproto/methods';

export async function POST({ request, platform }) {
	let body: { did: string; domain: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { did, domain } = body;

	if (!did || !domain) {
		return json({ error: 'Missing required fields: did and domain' }, { status: 400 });
	}

	// Validate domain format
	if (
		!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(
			domain
		)
	) {
		return json({ error: 'Invalid domain format' }, { status: 400 });
	}

	// Check the user's site.standard.publication record
	try {
		const client = await getClient({ did: did as Did });
		const record = await getRecord({
			did: did as Did,
			collection: 'site.standard.publication',
			rkey: 'blento.self',
			client
		});

		const recordUrl = record?.value?.url;
		const expectedUrl = `https://${domain}`;

		if (recordUrl !== expectedUrl) {
			return json(
				{
					error: `Publication record URL does not match. Expected "${expectedUrl}", got "${recordUrl || '(not set)'}".`
				},
				{ status: 400 }
			);
		}
	} catch {
		return json(
			{ error: 'Could not read site.standard.publication record. Make sure it exists.' },
			{ status: 400 }
		);
	}

	// Verify CNAME via DNS-over-HTTPS
	try {
		const dohUrl = `https://mozilla.cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`;
		const dnsRes = await fetch(dohUrl, {
			headers: { Accept: 'application/dns-json' }
		});
		const dnsData = await dnsRes.json();

		const cnameTarget = 'blento-proxy.fly.dev.';
		const cnameTargetNoDot = 'blento-proxy.fly.dev';

		const hasCname = dnsData.Answer?.some(
			(answer: { type: number; data: string }) =>
				answer.type === 5 && (answer.data === cnameTarget || answer.data === cnameTargetNoDot)
		);

		if (!hasCname) {
			return json(
				{
					error: `CNAME record not found. Please set a CNAME for "${domain}" pointing to "blento-proxy.fly.dev".`
				},
				{ status: 400 }
			);
		}
	} catch {
		return json({ error: 'Failed to verify DNS records.' }, { status: 500 });
	}

	// Write to CUSTOM_DOMAINS KV
	const kv = platform?.env?.CUSTOM_DOMAINS;
	if (!kv) {
		return json({ error: 'Domain storage is not available.' }, { status: 500 });
	}

	try {
		await kv.put(domain, did);
	} catch {
		return json({ error: 'Failed to save custom domain.' }, { status: 500 });
	}

	return json({ success: true });
}
