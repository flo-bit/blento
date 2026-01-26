<script lang="ts">
	import { Button, Modal, toast } from '@foxui/core';

	let {
		open = $bindable(),
		success,
		handle,
		page
	}: {
		open: boolean;
		success: boolean;
		handle: string;
		page: string;
	} = $props();

	function getShareUrl() {
		const base = typeof window !== 'undefined' ? window.location.origin : '';
		const pagePath = page && page !== 'blento.self' ? `/${page.replace('blento.', '')}` : '';
		return `${base}/${handle}${pagePath}`;
	}

	async function copyShareLink() {
		const url = getShareUrl();
		await navigator.clipboard.writeText(url);
		toast.success('Link copied to clipboard!');
	}
</script>

<Modal {open} closeButton={false}>
	<div class="flex flex-col items-center gap-4">
		{#if !success}
			<div class="flex items-center gap-4">
				<svg
					class="text-accent-500 size-8 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<p class="text-base-700 dark:text-base-300 text-3xl font-bold">Saving...</p>
			</div>
		{:else}
			<div class="flex items-center gap-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="text-accent-500 size-8"
				>
					<path
						fill-rule="evenodd"
						d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
						clip-rule="evenodd"
					/>
				</svg>

				<p class="text-base-700 dark:text-base-300 text-3xl font-bold">Website Saved</p>
			</div>
			<div class="mt-8 flex w-full flex-col gap-2">
				<Button size="lg" onclick={copyShareLink}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
						/>
					</svg>
					Share link
				</Button>
				<Button variant="ghost" onclick={() => (open = false)}>Close</Button>
			</div>
		{/if}
	</div>
</Modal>
