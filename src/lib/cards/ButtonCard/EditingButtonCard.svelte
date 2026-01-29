<script lang="ts">
	import type { ContentComponentProps } from '../types';
	import PlainTextEditor from '$lib/components/PlainTextEditor.svelte';

	let { item = $bindable() }: ContentComponentProps = $props();
</script>

<div class="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
	<div
		class="bg-accent-500 text-base-50 inline-flex items-center justify-center rounded-xl px-6 py-3 shadow-md"
	>
		<PlainTextEditor
			key="text"
			bind:contentDict={item.cardData}
			placeholder="Button text"
			class="text-center font-semibold"
		/>
	</div>
</div>
