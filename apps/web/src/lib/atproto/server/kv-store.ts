import type { KVNamespace } from '@cloudflare/workers-types';
import type { Store } from '@atcute/oauth-node-client';

export class KVStore<K extends string, V> implements Store<K, V> {
	private kv: KVNamespace;
	private expirationTtl?: number;

	constructor(kv: KVNamespace, options?: { expirationTtl?: number }) {
		this.kv = kv;
		this.expirationTtl = options?.expirationTtl;
	}

	async get(key: K): Promise<V | undefined> {
		const value = await this.kv.get(key, 'text');
		if (value === null) return undefined;
		return JSON.parse(value) as V;
	}

	async set(key: K, value: V): Promise<void> {
		await this.kv.put(key, JSON.stringify(value), {
			expirationTtl: this.expirationTtl
		});
	}

	async delete(key: K): Promise<void> {
		await this.kv.delete(key);
	}

	async clear(): Promise<void> {
		let cursor: string | undefined;
		do {
			const result = await this.kv.list({ cursor });
			for (const key of result.keys) {
				await this.kv.delete(key.name);
			}
			cursor = result.list_complete ? undefined : result.cursor;
		} while (cursor);
	}
}
