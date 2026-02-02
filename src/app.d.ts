import { KVNamespace } from '@cloudflare/workers-types';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				USER_DATA_CACHE: KVNamespace;
				CUSTOM_DOMAINS: KVNamespace;
			};
		}
	}
}

import type {} from '@atcute/atproto';
import type {} from '@atcute/bluesky';

export {};
