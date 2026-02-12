import { json } from '@sveltejs/kit';
import { isDid } from '@atcute/lexicons/syntax';
import { getRecord } from '$lib/atproto/methods';
import type { Did } from '@atcute/lexicons';

export async function POST({ request, platform }) {
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

	// Validate domain format
	if (
		!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(
			domain
		)
	) {
		return json({ error: 'Invalid domain format' }, { status: 400 });
	}

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

	// Write to CUSTOM_DOMAINS KV
	const kv = platform?.env?.CUSTOM_DOMAINS;
	if (!kv) {
		return json({ error: 'KV storage not available.' }, { status: 500 });
	}

	try {
		await kv.put(domain.toLowerCase(), did);
	} catch {
		return json({ error: 'Failed to register domain.' }, { status: 500 });
	}

	return json({ success: true });
}
