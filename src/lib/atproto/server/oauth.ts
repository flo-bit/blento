import {
	OAuthClient,
	MemoryStore,
	type ClientAssertionPrivateJwk,
	type OAuthClientStores,
	type OAuthSession,
	type StoredSession,
	type StoredState
} from '@atcute/oauth-node-client';
import type { Did } from '@atcute/lexicons';
import {
	CompositeDidDocumentResolver,
	CompositeHandleResolver,
	DohJsonHandleResolver,
	LocalActorResolver,
	PlcDidDocumentResolver,
	WebDidDocumentResolver,
	WellKnownHandleResolver
} from '@atcute/identity-resolver';
import { KVStore } from './kv-store';
import { DOH_RESOLVER, REDIRECT_PATH, SITE } from '../settings';
import { scopes } from './scopes';
import { dev } from '$app/environment';

const DEV_PORT = 5179;

function createActorResolver() {
	return new LocalActorResolver({
		handleResolver: new CompositeHandleResolver({
			methods: {
				dns: new DohJsonHandleResolver({ dohUrl: DOH_RESOLVER }),
				http: new WellKnownHandleResolver()
			}
		}),
		didDocumentResolver: new CompositeDidDocumentResolver({
			methods: {
				plc: new PlcDidDocumentResolver(),
				web: new WebDidDocumentResolver()
			}
		})
	});
}

function createStores(env?: App.Platform['env']): OAuthClientStores {
	if (env?.OAUTH_SESSIONS && env?.OAUTH_STATES) {
		return {
			sessions: new KVStore<Did, StoredSession>(env.OAUTH_SESSIONS),
			states: new KVStore<string, StoredState>(env.OAUTH_STATES, { expirationTtl: 600 })
		};
	}
	// Fallback to in-memory stores (dev without wrangler)
	return {
		sessions: new MemoryStore<Did, StoredSession>(),
		states: new MemoryStore<string, StoredState>({ ttl: 600_000 })
	};
}

// Cache OAuth clients per domain to avoid re-creating them on every request
const clientCache = new Map<string, OAuthClient>();

export function createOAuthClient(env?: App.Platform['env'], domain?: string): OAuthClient {
	const cacheKey = domain ?? '__default__';
	const cached = clientCache.get(cacheKey);
	if (cached) return cached;

	const actorResolver = createActorResolver();
	const stores = createStores(env);

	if (dev && !env?.CLIENT_ASSERTION_KEY) {
		// Dev without secrets: loopback public client (no keyset).
		const client = new OAuthClient({
			metadata: {
				redirect_uris: [`http://127.0.0.1:${DEV_PORT}${REDIRECT_PATH}`],
				scope: scopes
			},
			actorResolver,
			stores
		});
		clientCache.set(cacheKey, client);
		return client;
	}

	// Confidential client (production, or dev with secrets)
	if (!env?.CLIENT_ASSERTION_KEY) {
		throw new Error('CLIENT_ASSERTION_KEY secret is not set');
	}

	const site = domain ? `https://${domain}` : (SITE ?? 'https://blento.app');
	const key: ClientAssertionPrivateJwk = JSON.parse(env.CLIENT_ASSERTION_KEY);

	const client = new OAuthClient({
		metadata: {
			client_id: site + '/oauth-client-metadata.json',
			redirect_uris: [site + REDIRECT_PATH],
			scope: scopes,
			jwks_uri: site + '/oauth/jwks.json'
		},
		keyset: [key],
		actorResolver,
		stores
	});

	clientCache.set(cacheKey, client);
	return client;
}

export type { OAuthSession };
