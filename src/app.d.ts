import type {
	KVNamespace,
	D1Database,
	ExecutionContext,
	CacheStorage
} from '@cloudflare/workers-types';
import type { OAuthSession } from '@atcute/oauth-node-client';
import type { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: OAuthSession | null;
			client: Client | null;
			did: Did | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				USER_DATA_CACHE: KVNamespace;
				CUSTOM_DOMAINS: KVNamespace;
				OAUTH_SESSIONS: KVNamespace;
				OAUTH_STATES: KVNamespace;
				DB: D1Database;
				CLIENT_ASSERTION_KEY: string;
				COOKIE_SECRET: string;
				CRON_SECRET: string;
			};
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

import type {} from '@atcute/atproto';
import type {} from '@atcute/bluesky';
import type {} from './lexicon-types';

export {};
