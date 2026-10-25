import type { RequestEvent } from '@sveltejs/kit';
import { SingleFlight } from './single-flight';

const flight = new SingleFlight();
const publicRoutes = new Set(['/[[actor=actor]]/(pages)', '/[[actor=actor]]/(pages)/p/[[page]]']);

export function effectiveDomain(request: Request): string | undefined {
	const domain = request.headers.get('X-Custom-Domain');
	if (!domain) return new URL(request.url).hostname;
	// Never share a response for malformed or ambiguous forwarded domains.
	if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]+$/i.test(domain)) return;
	return domain.toLowerCase();
}

export function pageCacheKey(event: RequestEvent): Request | undefined {
	const { request, url, route } = event;
	const accept = request.headers.get('accept')?.trim() ?? '*/*';
	if (
		request.method !== 'GET' ||
		event.locals.did ||
		event.isDataRequest ||
		event.isSubRequest ||
		!publicRoutes.has(route.id ?? '') ||
		url.search ||
		[
			'cookie',
			'authorization',
			'range',
			'x-sveltekit-invalidated',
			'x-sveltekit-trailing-slash'
		].some((header) => request.headers.has(header)) ||
		(!accept.includes('text/html') && accept !== '*/*')
	) {
		return;
	}
	const domain = effectiveDomain(request);
	if (!domain) return;
	const key = new URL('/__blento_cache/page/v1', url.origin);
	key.searchParams.set('domain', domain);
	key.searchParams.set('path', url.pathname);
	key.searchParams.set('representation', 'html');
	// Do not serve old HTML referencing obsolete asset hashes after a code deployment.
	key.searchParams.set('version', event.platform?.env?.WORKER_VERSION?.id ?? 'local');
	return new Request(key);
}

export function canStorePage(response: Response): boolean {
	const control = response.headers.get('cache-control') ?? '';
	const vary = response.headers.get('vary');
	return (
		response.status === 200 &&
		response.headers.get('content-type')?.includes('text/html') === true &&
		!response.headers.has('set-cookie') &&
		/\bpublic\b/i.test(control) &&
		!/\b(private|no-store|no-cache)\b/i.test(control) &&
		(!vary || vary.toLowerCase() === 'accept-encoding')
	);
}

/** Only caches cookie-less public HTML. Auth, data requests and all interactive routes bypass. */
export async function resolvePublicPage(
	event: RequestEvent,
	resolve: () => Promise<Response>
): Promise<Response> {
	const key = pageCacheKey(event);
	const cache = event.platform?.caches?.default;
	if (!key || !cache) {
		const response = await resolve();
		if (
			event.locals.did ||
			event.request.headers.has('cookie') ||
			event.request.headers.has('authorization')
		) {
			const privateResponse = new Response(response.body, response);
			privateResponse.headers.set('Cache-Control', 'private, no-store');
			return privateResponse;
		}
		return response;
	}
	try {
		const cached = await cache.match(key);
		if (cached) {
			const response = new Response(cached.body, cached);
			response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60');
			response.headers.set('X-Blento-Cache', 'HIT');
			return response;
		}
	} catch {
		return resolve();
	}

	// Every consumer gets its own body stream, including concurrent misses.
	let leader = false;
	const response = await flight.run(key.url, async () => {
		leader = true;
		const response = await resolve();
		if (canStorePage(response)) {
			const stored = new Response(response.clone().body, response);
			// Cache API does not support stale-while-revalidate. Bounded freshness: 60 seconds.
			stored.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60');
			try {
				await cache.put(key, stored);
			} catch (err) {
				console.error('Public page cache write failed', err);
			}
		}
		return response;
	});
	// Never clone/share a Set-Cookie or private response between separate requests.
	// Those responses should not be produced by eligible public routes, but fail closed if they are.
	if (!canStorePage(response)) return leader ? response : resolve();
	const result = response.clone();
	result.headers.set('X-Blento-Cache', 'MISS');
	return result;
}
