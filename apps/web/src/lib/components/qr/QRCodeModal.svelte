<script lang="ts">
	import { Modal } from '@foxui/core';
	import QRCodeDisplay from './QRCodeDisplay.svelte';

	export type QRContext = {
		title?: string;
		icon?: string;
		iconColor?: string;
	};

	let {
		open = $bindable(false),
		href,
		context = {}
	}: {
		open: boolean;
		href: string;
		context?: QRContext;
	} = $props();
</script>

<Modal bind:open closeButton={true} class="max-w-[90vw]! sm:max-w-sm! md:max-w-md!">
	<div class="flex flex-col items-center justify-center gap-4 p-4">
		{#if context.title}
			<div class="text-base-900 dark:text-base-100 text-center text-3xl font-semibold">
				{context.title}
			</div>
		{/if}

		<div class="flex items-center justify-center overflow-hidden rounded-2xl">
			<QRCodeDisplay
				url={href}
				icon={context.icon}
				iconColor={context.iconColor}
				class="size-[min(70vw,320px)] sm:size-72 md:size-80"
			/>
		</div>
	</div>
</Modal>
