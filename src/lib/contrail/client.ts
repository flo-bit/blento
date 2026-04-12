import { Client, simpleFetchHandler } from '@atcute/client';

/**
 * Client-side: fully typed @atcute/client that queries the app's own /xrpc/ endpoints.
 */
export function getClient() {
	return new Client({ handler: simpleFetchHandler({ service: '' }) });
}
