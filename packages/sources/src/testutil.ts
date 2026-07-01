/**
 * Test helpers: a recording fake `fetch` that maps URL substrings to JSON responses.
 */
export interface FakeCall {
	url: string;
	method: string;
}

export interface FakeFetch {
	fetch: typeof fetch;
	calls: FakeCall[];
}

type Route = { match: string; body: unknown; status?: number; json?: boolean };

/** Build a fake fetch that returns the first route whose `match` is a substring of the URL. */
export function fakeFetch(routes: Route[]): FakeFetch {
	const calls: FakeCall[] = [];
	const impl = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
		const url = typeof input === 'string' ? input : input.toString();
		calls.push({ url, method: init?.method ?? 'GET' });
		const route = routes.find((r) => url.includes(r.match));
		if (!route) throw new Error(`fakeFetch: no route for ${url}`);
		const json = route.json ?? true;
		const headers = new Headers({ 'content-type': json ? 'application/json' : 'text/plain' });
		return new Response(json ? JSON.stringify(route.body) : String(route.body), {
			status: route.status ?? 200,
			headers
		});
	}) as unknown as typeof fetch;
	return { fetch: impl, calls };
}
