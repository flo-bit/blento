<script lang="ts">
	import { dev } from '$app/environment';
	import { user } from '$lib/atproto';
	import type { WebsiteData } from '$lib/types';

	let { data }: { data: WebsiteData } = $props();
</script>

{#if dev || (user.isLoggedIn && user.profile?.did === data.did)}
	<div
		class="bg-base-100 dark:bg-base-950 border-base-200 dark:border-base-800 fixed top-13 right-0 left-0 z-40 flex h-13 items-center gap-2 overflow-x-auto border-b px-4"
	>
		<button
			type="button"
			class="bg-base-900 dark:bg-base-100 text-base-50 dark:text-base-900 shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium"
		>
			main
		</button>
		<button
			type="button"
			class="border-base-300 dark:border-base-700 text-base-600 dark:text-base-400 hover:text-accent-600 dark:hover:text-accent-400 hover:border-accent-500 hover:bg-accent-500/5 flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm font-medium transition-colors"
			aria-label="Add page"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="size-3.5"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Add page
		</button>
	</div>
{/if}
