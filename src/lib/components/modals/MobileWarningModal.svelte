<script lang="ts">
	import { Button } from '@foxui/core';
	import Modal from '../modal/Modal.svelte';

	let { showMobileWarning = $bindable(false) } = $props();
</script>

<Modal bind:open={showMobileWarning} closeButton={false}>
	<div class="flex flex-col items-center gap-4 text-center">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="text-accent-500 size-10"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3"
			/>
		</svg>
		<p class="text-base-700 dark:text-base-300 text-xl font-bold">Mobile Editing</p>
		<p class="text-base-500 dark:text-base-400 text-sm">
			Mobile editing is currently experimental. For the best experience, use a desktop browser.
		</p>
		<Button class="mt-2 w-full" onclick={() => (showMobileWarning = false)}>Continue</Button>
	</div>
</Modal>
