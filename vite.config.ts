import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sveltekitOG } from '@ethercorps/sveltekit-og/plugin';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss(), sveltekitOG()],
	server: {
		host: '127.0.0.1',
		port: 5179
	},
	build: {
		sourcemap: true
	}
});
