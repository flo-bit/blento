/**
 * ATProto helper script for debugging.
 *
 * Usage:
 *   npx tsx scripts/atproto.ts listRecords <handle> <collection>
 *   npx tsx scripts/atproto.ts getRecord <handle> <collection> <rkey>
 *
 * Examples:
 *   npx tsx scripts/atproto.ts listRecords japan.selfhosted.social app.blento.card
 *   npx tsx scripts/atproto.ts getRecord japan.selfhosted.social app.blento.card self
 */

async function resolveHandle(handle: string): Promise<string> {
	// Try DNS-based resolution via DoH
	const dnsRes = await fetch(
		`https://mozilla.cloudflare-dns.com/dns-query?name=_atproto.${handle}&type=TXT`,
		{ headers: { Accept: 'application/dns-json' } }
	);
	const dns = await dnsRes.json();
	for (const answer of dns.Answer ?? []) {
		const match = answer.data?.replace(/"/g, '').match(/^did=(.+)$/);
		if (match) return match[1];
	}

	// Fallback: HTTP well-known
	const httpRes = await fetch(`https://${handle}/.well-known/atproto-did`);
	if (httpRes.ok) {
		const did = (await httpRes.text()).trim();
		if (did.startsWith('did:')) return did;
	}

	throw new Error(`Could not resolve handle: ${handle}`);
}

async function resolvePDS(did: string): Promise<string> {
	let docUrl: string;
	if (did.startsWith('did:plc:')) {
		docUrl = `https://plc.directory/${did}`;
	} else if (did.startsWith('did:web:')) {
		const host = did.replace('did:web:', '');
		docUrl = `https://${host}/.well-known/did.json`;
	} else {
		throw new Error(`Unsupported DID method: ${did}`);
	}

	const res = await fetch(docUrl);
	if (!res.ok) throw new Error(`Failed to fetch DID document: ${res.status}`);
	const doc = await res.json();

	for (const service of doc.service ?? []) {
		if (service.id === '#atproto_pds') {
			return service.serviceEndpoint;
		}
	}
	throw new Error('No #atproto_pds service found in DID document');
}

async function listRecords(handle: string, collection: string) {
	const did = await resolveHandle(handle);
	const pds = await resolvePDS(did);
	console.error(`Resolved: ${handle} → ${did} @ ${pds}`);

	const allRecords: any[] = [];
	let cursor: string | undefined;

	do {
		const params = new URLSearchParams({
			repo: did,
			collection,
			limit: '100'
		});
		if (cursor) params.set('cursor', cursor);

		const res = await fetch(`${pds}/xrpc/com.atproto.repo.listRecords?${params}`);
		if (!res.ok) {
			const body = await res.text();
			throw new Error(`listRecords failed: ${res.status} ${body}`);
		}
		const data = await res.json();
		allRecords.push(...data.records);
		cursor = data.cursor;
	} while (cursor);

	console.log(JSON.stringify(allRecords, null, 2));
}

async function getRecord(handle: string, collection: string, rkey: string) {
	const did = await resolveHandle(handle);
	const pds = await resolvePDS(did);
	console.error(`Resolved: ${handle} → ${did} @ ${pds}`);

	const params = new URLSearchParams({ repo: did, collection, rkey });
	const res = await fetch(`${pds}/xrpc/com.atproto.repo.getRecord?${params}`);
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`getRecord failed: ${res.status} ${body}`);
	}
	const data = await res.json();
	console.log(JSON.stringify(data, null, 2));
}

// CLI
const [, , command, ...args] = process.argv;

switch (command) {
	case 'listRecords':
		if (args.length < 2) {
			console.error('Usage: listRecords <handle> <collection>');
			process.exit(1);
		}
		listRecords(args[0], args[1]).catch((e) => {
			console.error(e.message);
			process.exit(1);
		});
		break;

	case 'getRecord':
		if (args.length < 3) {
			console.error('Usage: getRecord <handle> <collection> <rkey>');
			process.exit(1);
		}
		getRecord(args[0], args[1], args[2]).catch((e) => {
			console.error(e.message);
			process.exit(1);
		});
		break;

	default:
		console.error('Commands: listRecords, getRecord');
		console.error('  listRecords <handle> <collection>');
		console.error('  getRecord <handle> <collection> <rkey>');
		process.exit(1);
}
