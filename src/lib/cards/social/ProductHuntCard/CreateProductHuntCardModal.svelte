<script lang="ts">
	import { Alert, Button, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let embedCode = $state('');
	let errorMessage = $state('');

	function parseEmbedCode(code: string): {
		imageSrc: string | null;
		linkHref: string | null;
	} {
		const normalized = code.replaceAll('&amp;', '&');

		const srcMatch = normalized.match(/src="(https:\/\/api\.producthunt\.com\/[^"]+)"/);
		const imageSrc = srcMatch ? srcMatch[1] : null;

		const hrefMatch = normalized.match(/href="(https:\/\/www\.producthunt\.com\/[^"]+)"/);
		const linkHref = hrefMatch ? hrefMatch[1] : null;

		return { imageSrc, linkHref };
	}

	function validate(): boolean {
		errorMessage = '';

		const { imageSrc, linkHref } = parseEmbedCode(embedCode);

		if (!linkHref) {
			errorMessage = 'Could not find a Product Hunt link in the embed code';
			return false;
		}

		if (!imageSrc) {
			errorMessage = 'Could not find a Product Hunt badge image in the embed code';
			return false;
		}

		item.cardData.imageSrc = imageSrc;
		item.cardData.linkHref = linkHref;

		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Paste Product Hunt Embed Code</Subheading>

	<textarea
		bind:value={embedCode}
		placeholder="<a href=&quot;https://www.producthunt.com/posts/your-product?..."
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
