import { describe, it, expect } from 'vitest';
import { resolve } from './resolve.js';
import type { Source, SourceContext } from './types.js';
import { fakeFetch } from './testutil.js';

const httpSource = (url: string): Source => ({ $type: 'app.blento.source#http', url });

describe('#http', () => {
	it('refuses when the host is not allow-listed (default: empty)', async () => {
		const ff = fakeFetch([{ match: 'example.com', body: {} }]);
		const ctx: SourceContext = { self: 'x', fetchImpl: ff.fetch };
		await expect(resolve(httpSource('https://example.com/data.json'), ctx)).rejects.toThrow(
			/not allow-listed/
		);
		expect(ff.calls.length).toBe(0);
	});

	it('fetches when the host is allow-listed and parses JSON', async () => {
		const ff = fakeFetch([{ match: 'api.example.com', body: { hello: 'world' } }]);
		const ctx: SourceContext = {
			self: 'x',
			fetchImpl: ff.fetch,
			httpAllowlist: ['api.example.com']
		};
		const res = await resolve(httpSource('https://api.example.com/data.json'), ctx);
		expect(res.data).toEqual({ hello: 'world' });
	});

	it('refuses non-http(s) protocols', async () => {
		const ctx: SourceContext = { self: 'x', httpAllowlist: ['x'] };
		await expect(resolve(httpSource('file:///etc/passwd'), ctx)).rejects.toThrow(/protocol/);
	});
});
