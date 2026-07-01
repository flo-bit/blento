<script lang="ts">
	import { getCanEdit } from '$lib/website/data/context';
	import type { ContentComponentProps } from '../../types';

	let { item }: ContentComponentProps = $props();

	let isEditing = getCanEdit();

	const href = $derived((item.cardData.href as string | undefined) ?? '');
</script>

{#if href}
	<iframe
		src={href}
		sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
		referrerpolicy="no-referrer"
		class={['absolute inset-0 h-full w-full', isEditing() && 'pointer-events-none']}
		title="Baserow form"
	></iframe>
{:else}
	<div
		class="text-base-500 dark:text-base-400 accent:text-base-700 flex h-full w-full items-center justify-center p-4 text-center text-xs italic"
	>
		Paste a Baserow form link in card settings to embed it.
	</div>
{/if}
