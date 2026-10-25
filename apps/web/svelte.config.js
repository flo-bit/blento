import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { disableAdapterCache } from './scripts/disable-adapter-cache.mjs';

const cloudflare = adapter();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: {
			...cloudflare,
			async adapt(builder) {
				await cloudflare.adapt(builder);
				await disableAdapterCache('.svelte-kit/cloudflare/_worker.js');
			}
		},
		paths: {
			base: ''
		},
		experimental: {
			remoteFunctions: true
		}
	},

	vitePlugin: {
		inspector: true
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
