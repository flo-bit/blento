<script lang="ts">
	import type { ContentComponentProps } from '../types';

	let { item }: ContentComponentProps = $props();
</script>

<a
	href={item.cardData.href || '#'}
	target="_blank"
	rel="noopener noreferrer"
	class="flex h-full w-full items-center justify-center p-4"
>
	<span
		class="bg-accent-500 hover:bg-accent-600 text-base-50 inline-flex items-center justify-center rounded-xl px-6 py-3 text-center font-semibold shadow-md transition-colors"
	>
		{item.cardData.text || 'Click me'}
	</span>
</a>
