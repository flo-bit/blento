import { json } from '@sveltejs/kit';
import { isDid } from '@atcute/lexicons/syntax';
import { getRecord } from '$lib/atproto/methods';
import { verifyDomainDns } from '$lib/dns';
import type { Did } from '@atcute/lexicons';

const EXPECTED_TARGET = 'blento-proxy.fly.dev';

export async function POST({ request, platform, locals }) {
	if (!locals.did) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	let body: { did: string; domain: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { did, domain } = body;

	if (!did || !domain) {
		return json({ error: 'Missing required fields: did, domain' }, { status: 400 });
	}

	if (!isDid(did)) {
		return json({ error: 'Invalid DID format' }, { status: 400 });
	}

	if (did !== locals.did) {
		return json({ error: 'DID does not match authenticated session' }, { status: 403 });
	}

	if (
		!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(
			domain
		)
	) {
		return json({ error: 'Invalid domain format' }, { status: 400 });
	}

	const normalizedDomain = domain.toLowerCase();

	// Verify the user's ATProto profile has this domain set
	try {
		const record = await getRecord({
			did: did as Did,
			collection: 'site.standard.publication',
			rkey: 'blento.self'
		});

		const url = (record?.value as Record<string, unknown>)?.url;
		if (url !== `https://${domain}`) {
			return json(
				{
					error: `Profile does not have this domain set. Expected "https://${domain}" but got "${url || '(none)'}".`
				},
				{ status: 403 }
			);
		}
	} catch {
		return json({ error: 'Failed to verify profile record.' }, { status: 500 });
	}

	// Verify the domain actually points at our proxy via DNS before binding it.
	try {
		const result = await verifyDomainDns(normalizedDomain, EXPECTED_TARGET);
		if (!result.ok) {
			return json({ error: result.error, hint: result.hint }, { status: 400 });
		}
	} catch {
		return json({ error: 'Failed to verify DNS records.' }, { status: 500 });
	}

	const kv = platform?.env?.CUSTOM_DOMAINS;
	if (!kv) {
		return json({ error: 'KV storage not available.' }, { status: 500 });
	}

	try {
		const existing = await kv.get(normalizedDomain);
		if (existing && existing !== did) {
			return json({ error: 'Domain is already bound to a different account.' }, { status: 409 });
		}
		await kv.put(normalizedDomain, did);
	} catch {
		return json({ error: 'Failed to register domain.' }, { status: 500 });
	}

	return json({ success: true });
}
