import { describe, expect, it, vi } from 'vitest';
import type { R2Bucket, KVNamespace } from '@cloudflare/workers-types';
import { ogObjectKey, readOgImage } from './og-storage';

const bytes = new Uint8Array([1, 2, 3]).buffer;
function resources() {
	const bucket = { get: vi.fn(async () => null), put: vi.fn(async () => ({})) };
	const kv = { get: vi.fn(async () => bytes), delete: vi.fn(async () => {}) };
	return {
		bucket,
		kv,
		read: () =>
			readOgImage(bucket as unknown as R2Bucket, kv as unknown as KVNamespace, 'did:plc:test')
	};
}
describe('OG image storage', () => {
	it('returns R2 bytes without reading KV', async () => {
		const { bucket, kv } = resources();
		bucket.get.mockResolvedValue({ arrayBuffer: async () => bytes } as never);
		expect(
			await readOgImage(bucket as unknown as R2Bucket, kv as unknown as KVNamespace, 'did:plc:test')
		).toBe(bytes);
		expect(kv.get).not.toHaveBeenCalled();
	});
	it('migrates legacy images once and deletes KV only after persistence', async () => {
		const { bucket, kv, read } = resources();
		expect(await Promise.all(Array.from({ length: 10 }, read))).toEqual(Array(10).fill(bytes));
		expect(bucket.put).toHaveBeenCalledTimes(1);
		expect(kv.delete).toHaveBeenCalledTimes(1);
		expect(bucket.put.mock.invocationCallOrder[0]).toBeLessThan(
			kv.delete.mock.invocationCallOrder[0]
		);
	});
	it('keeps existing KV bytes if R2 persistence fails', async () => {
		const { bucket, kv, read } = resources();
		bucket.put.mockRejectedValue(new Error('R2 unavailable'));
		expect(await read()).toBe(bytes);
		expect(kv.delete).not.toHaveBeenCalled();
	});
	it('does not overwrite a concurrent owner update with stale KV bytes', async () => {
		const { bucket, kv, read } = resources();
		const fresh = new Uint8Array([9]).buffer;
		bucket.put.mockResolvedValue(null as never);
		bucket.get
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ arrayBuffer: async () => fresh } as never);
		expect(await read()).toBe(fresh);
		expect(bucket.put).toHaveBeenCalledWith(
			ogObjectKey('did:plc:test'),
			bytes,
			expect.objectContaining({ onlyIf: { etagDoesNotMatch: '*' } })
		);
		expect(kv.delete).toHaveBeenCalledTimes(1);
	});
	it('uses a bounded replacement key, not a timestamp history', () => {
		expect(ogObjectKey('did:plc:test')).toBe('og/v1/did%3Aplc%3Atest.png');
	});
});
