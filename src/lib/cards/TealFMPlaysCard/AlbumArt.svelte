<script lang="ts">
	let { releaseMbId, alt }: { releaseMbId: string; alt: string } = $props();

	let isLoading = $state(true);
	let hasError = $state(false);
</script>

{#if isLoading}
	<div class="bg-base-200 dark:bg-base-800 h-10 w-10 animate-pulse rounded-lg"></div>
{/if}

{#if hasError}
	<div
		class="bg-base-300 dark:bg-base-800 accent:bg-accent-700/50 flex h-10 w-10 items-center justify-center rounded-lg"
	>
		<svg
			class="text-base-400 dark:text-base-600 accent:text-accent-900 h-5 w-5"
			fill="currentColor"
			viewBox="0 0 20 20"
		>
			<path
				d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
			/>
		</svg>
	</div>
{:else}
	<img
		src="https://coverartarchive.org/release/{releaseMbId}/front-250"
		{alt}
		class="h-10 w-10 rounded-lg object-cover {isLoading && 'hidden'}"
		onload={() => {
			isLoading = false;
		}}
		onerror={() => {
			isLoading = false;
			hasError = true;
		}}
	/>
{/if}
