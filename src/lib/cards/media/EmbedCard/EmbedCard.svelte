<script lang="ts">
	import { getCanEdit } from '$lib/website/context';
	import type { ContentComponentProps } from '../../types';

	let { item }: ContentComponentProps = $props();

	let isEditing = getCanEdit();
</script>

<iframe
	src={item.cardData.href}
	sandbox="allow-scripts"
	referrerpolicy="no-referrer"
	class={['absolute inset-0 h-full w-full', isEditing() && 'pointer-events-none']}
	title=""
></iframe>
