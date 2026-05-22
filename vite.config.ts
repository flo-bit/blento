import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sveltekitOG } from '@ethercorps/sveltekit-og/plugin';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss(), sveltekitOG()],
	// Keep a single copy of these shared deps. @atmo-dev/events-ui and blento both
	// pull in bits-ui / @internationalized/date / svelte; without deduping, bits-ui's
	// `instanceof Time` checks can fail across copies → "dateValue.toDate is not a
	// function" in the time picker.
	resolve: {
		dedupe: ['bits-ui', '@internationalized/date', 'svelte']
	},
	server: {
		host: '127.0.0.1',
		port: 5179
	},
	build: {
		sourcemap: true,
		rollupOptions: {
			external: ['cloudflare:sockets']
		}
	}
});
