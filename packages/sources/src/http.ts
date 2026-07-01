/**
 * The `#http` kind: a server-side GET of a fixed URL. Guarded by a host allowlist (empty ⇒ refuse),
 * because arbitrary server-side fetch is the primary risk surface.
 */
import type { ResolveResult, Source, SourceContext } from './types.js';

type HttpSource = Extract<Source, { $type: 'app.blento.source#http' }>;

function assertHostAllowed(url: string, allowlist: string[] | undefined): URL {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(`http source refused: invalid url "${url}"`);
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		throw new Error(`http source refused: unsupported protocol "${parsed.protocol}"`);
	}
	const host = parsed.hostname.toLowerCase();
	const allowed = (allowlist ?? []).some((h) => h.toLowerCase() === host);
	if (!allowed) {
		throw new Error(`http source refused: host "${host}" is not allow-listed`);
	}
	return parsed;
}

/** Resolve an `#http` source. Returns parsed JSON when the response is JSON, else the raw text. */
export async function resolveHttp(source: HttpSource, ctx: SourceContext): Promise<ResolveResult> {
	const url = assertHostAllowed(source.url, ctx.httpAllowlist);
	const fetchImpl = ctx.fetchImpl ?? fetch;

	const res = await fetchImpl(url);
	if (!res.ok) throw new Error(`http source failed: ${res.status} ${res.statusText}`);

	const contentType = res.headers.get('content-type') ?? '';
	const data = contentType.includes('json') ? await res.json() : await res.text();
	return { data };
}
