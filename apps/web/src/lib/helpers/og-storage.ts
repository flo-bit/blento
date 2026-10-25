import type { R2Bucket, KVNamespace } from '@cloudflare/workers-types';
import { SingleFlight } from './single-flight';

export const OG_PREFIX = 'og/v1/';
export const MAX_OG_BYTES = 8 * 1024 * 1024;
const migrationFlights = new WeakMap<R2Bucket, SingleFlight>();

export function ogObjectKey(actor: string): string {
	// One object per actor/template. Successful updates replace it; no unbounded version history.
	return `${OG_PREFIX}${encodeURIComponent(actor)}.png`;
}

export async function readOgImage(
	bucket: R2Bucket | undefined,
	kv: KVNamespace | undefined,
	actor: string
): Promise<ArrayBuffer | undefined> {
	if (bucket) {
		const object = await bucket.get(ogObjectKey(actor));
		if (object) return object.arrayBuffer();
	}
	if (!kv) return;
	let flight = bucket && migrationFlights.get(bucket);
	if (!flight) {
		flight = new SingleFlight();
		if (bucket) migrationFlights.set(bucket, flight);
	}
	return flight.run(actor, async () => {
		const legacy = await kv.get(`og:${actor}`, 'arrayBuffer');
		if (!legacy || legacy.byteLength > MAX_OG_BYTES) return;
		if (bucket) {
			// Await durable persistence BEFORE deleting the legacy key. Failure leaves KV intact.
			try {
				const migrated = await bucket.put(ogObjectKey(actor), legacy, {
					httpMetadata: { contentType: 'image/png' },
					onlyIf: { etagDoesNotMatch: '*' }
				});
				// A concurrent migration or owner update must win over stale KV bytes.
				if (!migrated) {
					const current = await bucket.get(ogObjectKey(actor));
					if (!current) return legacy;
					const bytes = await current.arrayBuffer();
					await kv.delete(`og:${actor}`);
					return bytes;
				}
				await kv.delete(`og:${actor}`);
			} catch (err) {
				console.error('OG cache migration failed', err);
			}
		}
		return legacy;
	});
}
