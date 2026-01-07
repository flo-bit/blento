<script lang="ts">
	import 'gridstack/dist/gridstack.min.css';
	import { GridStack } from 'gridstack';
	import { onMount, tick } from 'svelte';

	let { ref = $bindable(), options, children, ...rest } = $props();

	onMount(async () => {
		await tick();
		console.log(`Initializing grid options=${JSON.stringify(options)}`);
		ref = GridStack.init(options);
	});
</script>

<div class={'grid-stack'}>
	{@render children?.()}
</div>
