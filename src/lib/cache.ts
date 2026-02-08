import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';
import type { KVNamespace } from '@cloudflare/workers-types';

/** TTL in seconds for each cache namespace */
const NAMESPACE_TTL = {
	blento: 60 * 60 * 24, // 24 hours
	identity: 60 * 60 * 24 * 7, // 7 days
	github: 60 * 60 * 12, // 12 hours
	'gh-contrib': 60 * 60 * 12, // 12 hours
	lastfm: 60 * 60, // 1 hour (default, overridable per-put)
	npmx: 60 * 60 * 12, // 12 hours
	meta: 0 // no auto-expiry
} as const;

export type CacheNamespace = keyof typeof NAMESPACE_TTL;

export class CacheService {
	constructor(private kv: KVNamespace) {}

	// === Generic namespaced operations ===

	async get(namespace: CacheNamespace, key: string): Promise<string | null> {
		return this.kv.get(`${namespace}:${key}`);
	}

	async put(
		namespace: CacheNamespace,
		key: string,
		value: string,
		ttlSeconds?: number
	): Promise<void> {
		const ttl = ttlSeconds ?? NAMESPACE_TTL[namespace] ?? 0;
		await this.kv.put(`${namespace}:${key}`, value, ttl > 0 ? { expirationTtl: ttl } : undefined);
	}

	async delete(namespace: CacheNamespace, key: string): Promise<void> {
		await this.kv.delete(`${namespace}:${key}`);
	}

	async list(namespace: CacheNamespace): Promise<string[]> {
		const prefix = `${namespace}:`;
		const result = await this.kv.list({ prefix });
		return result.keys.map((k) => k.name.slice(prefix.length));
	}

	// === JSON convenience ===

	async getJSON<T = unknown>(namespace: CacheNamespace, key: string): Promise<T | null> {
		const raw = await this.get(namespace, key);
		if (!raw) return null;
		return JSON.parse(raw) as T;
	}

	async putJSON(
		namespace: CacheNamespace,
		key: string,
		value: unknown,
		ttlSeconds?: number
	): Promise<void> {
		await this.put(namespace, key, JSON.stringify(value), ttlSeconds);
	}

	// === blento data (keyed by DID, with handle↔did resolution) ===
	async getBlento(identifier: ActorIdentifier): Promise<string | null> {
		const did = await this.resolveDid(identifier);
		if (!did) return null;
		return this.get('blento', did);
	}

	async putBlento(did: string, handle: string, data: string): Promise<void> {
		await Promise.all([
			this.put('blento', did, data),
			this.put('identity', `h:${handle}`, did),
			this.put('identity', `d:${did}`, handle)
		]);
	}

	async listBlentos(): Promise<string[]> {
		return this.list('blento');
	}

	// === Identity resolution ===
	async resolveDid(identifier: ActorIdentifier): Promise<string | null> {
		if (isDid(identifier)) return identifier;
		return this.get('identity', `h:${identifier}`);
	}

	async resolveHandle(did: Did): Promise<string | null> {
		return this.get('identity', `d:${did}`);
	}
}

export function createCache(platform?: App.Platform): CacheService | undefined {
	const kv = platform?.env?.USER_DATA_CACHE;
	if (!kv) return undefined;
	return new CacheService(kv);
}
