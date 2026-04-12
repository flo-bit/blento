import type { Did } from '@atcute/lexicons';
import type { KVNamespace } from '@cloudflare/workers-types';
import { getBlentoOrBskyProfile } from '$lib/atproto/methods';

/** TTL in seconds for each cache namespace */
const NAMESPACE_TTL = {
	github: 60 * 60 * 12, // 12 hours
	'gh-contrib': 60 * 60 * 12, // 12 hours
	lastfm: 60 * 60, // 1 hour (default, overridable per-put)
	listenbrainz: 60 * 60, // 1 hour (default, overridable per-put)
	npmx: 60 * 60 * 12, // 12 hours
	og: 60 * 60 * 24 * 30, // 30 days
	profile: 60 * 60 * 24, // 24 hours
	ical: 60 * 60 * 2, // 2 hours
	events: 60 * 60, // 1 hour
	rsvps: 60 * 60, // 1 hour
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

	// === ArrayBuffer convenience (for binary data like images) ===

	async getArrayBuffer(namespace: CacheNamespace, key: string): Promise<ArrayBuffer | null> {
		return this.kv.get(`${namespace}:${key}`, 'arrayBuffer');
	}

	async putArrayBuffer(
		namespace: CacheNamespace,
		key: string,
		value: ArrayBuffer,
		ttlSeconds?: number
	): Promise<void> {
		const ttl = ttlSeconds ?? NAMESPACE_TTL[namespace] ?? 0;
		await this.kv.put(`${namespace}:${key}`, value, ttl > 0 ? { expirationTtl: ttl } : undefined);
	}

	// === Profile cache (did → profile data) ===
	async getProfile(did: Did): Promise<CachedProfile> {
		const cached = await this.getJSON<CachedProfile>('profile', did);
		if (cached) return cached;

		const profile = await getBlentoOrBskyProfile({ did });
		const data: CachedProfile = {
			did: profile.did as string,
			handle: profile.handle as string,
			displayName: profile.displayName as string | undefined,
			avatar: profile.avatar as string | undefined,
			hasBlento: profile.hasBlento,
			url: profile.url
		};

		await this.putJSON('profile', did, data);
		return data;
	}
}

export type CachedProfile = {
	did: string;
	handle: string;
	displayName?: string;
	avatar?: string;
	hasBlento: boolean;
	url?: string;
};

export function createCache(platform?: App.Platform): CacheService | undefined {
	const kv = platform?.env?.USER_DATA_CACHE;
	if (!kv) return undefined;
	return new CacheService(kv);
}
