/**
 * Identity resolution for the `#atproto` PDS path: turn a did/handle into the actor's PDS endpoint.
 * Only `com.atproto.repo.*` / `com.atproto.sync.*` queries need this; appview queries take the
 * handle/did as a plain param.
 */

const PLC_DIRECTORY = 'https://plc.directory';

function pdsFromDidDoc(doc: unknown): string | undefined {
	const services = (doc as { service?: unknown }).service;
	if (!Array.isArray(services)) return undefined;
	const svc = services.find((s) => (s as { id?: string }).id === '#atproto_pds') as
		| { serviceEndpoint?: unknown }
		| undefined;
	return typeof svc?.serviceEndpoint === 'string' ? svc.serviceEndpoint : undefined;
}

/** Resolve a DID → PDS endpoint. Supports `did:plc` (plc.directory) and `did:web` (well-known). */
async function resolveDidToPds(did: string, fetchImpl: typeof fetch): Promise<string> {
	if (did.startsWith('did:plc:')) {
		const r = await fetchImpl(`${PLC_DIRECTORY}/${did}`);
		if (!r.ok) throw new Error(`plc.directory returned ${r.status} for ${did}`);
		const pds = pdsFromDidDoc(await r.json());
		if (!pds) throw new Error(`no #atproto_pds service in DID doc for ${did}`);
		return pds;
	}
	if (did.startsWith('did:web:')) {
		const host = did.slice('did:web:'.length).replace(/:/g, '/');
		const r = await fetchImpl(`https://${host}/.well-known/did.json`);
		if (!r.ok) throw new Error(`did:web doc returned ${r.status} for ${did}`);
		const pds = pdsFromDidDoc(await r.json());
		if (!pds) throw new Error(`no #atproto_pds service in DID doc for ${did}`);
		return pds;
	}
	throw new Error(`unsupported DID method: ${did}`);
}

/**
 * Resolve a did OR handle to the actor's PDS endpoint. A handle is first resolved to a did via the
 * given appview's `com.atproto.identity.resolveHandle`.
 */
export async function resolvePds(
	identifier: string,
	appview: string,
	fetchImpl: typeof fetch
): Promise<string> {
	let did = identifier;
	if (!identifier.startsWith('did:')) {
		const url = new URL('/xrpc/com.atproto.identity.resolveHandle', appview);
		url.searchParams.set('handle', identifier);
		const r = await fetchImpl(url);
		if (!r.ok) throw new Error(`could not resolve handle ${identifier} (${r.status})`);
		const body = (await r.json()) as { did?: string };
		if (!body.did) throw new Error(`no did for handle ${identifier}`);
		did = body.did;
	}
	return resolveDidToPds(did, fetchImpl);
}
