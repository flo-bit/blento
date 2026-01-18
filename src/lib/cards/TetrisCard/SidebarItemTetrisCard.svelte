<script lang="ts">
	import { Button } from '@foxui/core';

	let { onclick }: { onclick: () => void } = $props();
</script>

<Button {onclick} variant="ghost" class="w-full justify-start">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		class="text-accent-600 dark:text-accent-400"
	>
		<!-- Tetris blocks -->
		<rect x="4" y="4" width="5" height="5" />
		<rect x="9" y="4" width="5" height="5" />
		<rect x="9" y="9" width="5" height="5" />
		<rect x="14" y="9" width="5" height="5" />
		<rect x="4" y="14" width="5" height="5" />
		<rect x="9" y="14" width="5" height="5" />
		<rect x="14" y="14" width="5" height="5" />
	</svg>

	Tetris</Button
>
