<script lang="ts">
	import { getCanEdit } from '$lib/website/context';
	import type { ContentComponentProps } from '../types';

	let { item }: ContentComponentProps = $props();

	let isEditing = getCanEdit();

	let linkHref = $derived(item.cardData.linkHref || '');
	let lightImageSrc = $derived(
		(item.cardData.imageSrc || '').replace(/theme=(light|dark|neutral)/, 'theme=light')
	);
	let darkImageSrc = $derived(
		(item.cardData.imageSrc || '').replace(/theme=(light|dark|neutral)/, 'theme=dark')
	);
</script>

<a
	href={linkHref}
	target="_blank"
	rel="noopener noreferrer"
	class={[
		'flex h-full w-full items-center justify-center p-4',
		isEditing() && 'pointer-events-none'
	]}
>
	<img
		src={lightImageSrc}
		alt="Product Hunt badge"
		class="max-h-full max-w-full object-contain dark:hidden"
	/>
	<img
		src={darkImageSrc}
		alt="Product Hunt badge"
		class="hidden max-h-full max-w-full object-contain dark:block"
	/>
</a>
