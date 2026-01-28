<script lang="ts">
	let {
		accentColor = 'pink',
		baseColor = 'stone'
	}: {
		accentColor?: string;
		baseColor?: string;
	} = $props();

	let script = $derived(
		`<script>(function(){document.documentElement.classList.add(${JSON.stringify(accentColor)},${JSON.stringify(baseColor)});})();<` +
			'/script>'
	);
</script>

<svelte:head>
	{@html script}
</svelte:head>
