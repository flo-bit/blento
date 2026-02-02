<script lang="ts">
	import { Alert, Button, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let embedCode = $state('');
	let errorMessage = $state('');

	function parseInput(code: string): {
		src: string | null;
		widgetType: 'card' | 'video';
	} {
		const normalized = code.trim().replaceAll('&amp;', '&');

		// Try iframe embed code first
		const srcMatch = normalized.match(/src="(https:\/\/www\.kickstarter\.com\/[^"]+)"/);
		if (srcMatch) {
			const src = srcMatch[1];
			const widgetType = src.includes('/widget/video') ? 'video' : 'card';
			return { src, widgetType };
		}

		// Try plain project URL
		const urlMatch = normalized.match(/kickstarter\.com\/projects\/([^/]+\/[^/?#\s]+)/i);
		if (urlMatch) {
			return {
				src: `https://www.kickstarter.com/projects/${urlMatch[1]}/widget/card.html?v=2`,
				widgetType: 'card'
			};
		}

		return { src: null, widgetType: 'card' };
	}

	function validate(): boolean {
		errorMessage = '';

		const { src, widgetType } = parseInput(embedCode);

		if (!src) {
			errorMessage = 'Could not find a Kickstarter URL in the input';
			return false;
		}

		item.cardData.src = src;
		item.cardData.widgetType = widgetType;

		if (widgetType === 'video') {
			item.w = 4;
			item.h = 2;
			item.mobileW = 8;
			item.mobileH = 4;
		} else {
			item.w = 4;
			item.h = 4;
			item.mobileW = 8;
			item.mobileH = 8;
		}

		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Paste Kickstarter URL or Embed Code</Subheading>

	<textarea
		bind:value={embedCode}
		placeholder="https://www.kickstarter.com/projects/..."
		rows={5}
		class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-700 text-base-900 dark:text-base-100 w-full rounded-xl border px-3 py-2 font-mono text-sm"
	></textarea>

	{#if errorMessage}
		<Alert type="error" title="Invalid embed code"><span>{errorMessage}</span></Alert>
	{/if}

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button
			onclick={() => {
				if (validate()) oncreate();
			}}
		>
			Create
		</Button>
	</div>
</Modal>
