<script lang="ts">
	import { Modal } from '@foxui/core';
	import QRCodeDisplay from '$lib/components/qr/QRCodeDisplay.svelte';
	import type { ContentComponentProps } from '../../types';
	import { parseVCardName, parseVCardOrg } from '.';

	let { item }: ContentComponentProps = $props();

	let showQR = $state(false);

	let displayName = $derived(
		item.cardData.displayName || parseVCardName(item.cardData.vcard || '') || 'Contact'
	);
	let org = $derived(parseVCardOrg(item.cardData.vcard || ''));
</script>

<button
	class="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 p-3"
	onclick={() => (showQR = true)}
	><div
		class="text-base-500 dark:text-base-400 accent:text-base-700 text-[12px] font-medium tracking-wide uppercase"
	>
		vCard
	</div>
	<!-- Identification Card icon (Heroicons) -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
		class="text-base-700 dark:text-base-300 accent:text-base-900 size-10"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"
		/>
	</svg>

	<div class="text-center">
		<div class="text-base-900 dark:text-base-100 accent:text-base-900 text-sm font-semibold">
			{displayName}
		</div>
		{#if org}
			<div class="text-base-600 dark:text-base-400 accent:text-base-800 text-xs">
				{org}
			</div>
		{/if}
	</div>
</button>

<Modal bind:open={showQR} closeButton={true} class="max-w-[90vw]! sm:max-w-sm! md:max-w-md!">
	<div class="flex flex-col items-center justify-center gap-4 p-4">
		<div class="text-base-900 dark:text-base-100 text-center text-2xl font-semibold">
			{displayName}
		</div>

		<div class="flex items-center justify-center overflow-hidden rounded-2xl">
			<QRCodeDisplay
				url={item.cardData.vcard || ''}
				class="size-[min(70vw,320px)] sm:size-72 md:size-80"
			/>
		</div>

		<p class="text-base-600 dark:text-base-400 text-center text-sm">
			Scan to add contact to your phone
		</p>
	</div>
</Modal>
