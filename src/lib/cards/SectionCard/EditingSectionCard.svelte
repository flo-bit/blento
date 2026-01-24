<script lang="ts">
	import type { Item } from '$lib/types';
	import type { ContentComponentProps } from '../types';
	import PlainTextEditor from '../utils/PlainTextEditor.svelte';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();
</script>

<div
	class="line-clamp-1 inline-flex h-full w-full items-center rounded-md p-1 px-2 text-2xl font-semibold"
>
	<PlainTextEditor bind:item key="text" class="line-clamp-1 w-full" />
</div>
