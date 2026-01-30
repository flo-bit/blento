<script lang="ts">
	let {
		accentColor = 'pink',
		baseColor = 'stone'
	}: {
		accentColor?: string;
		baseColor?: string;
	} = $props();

	const safeJson = (v: string) => JSON.stringify(v).replace(/</g, '\\u003c');

	let script = $derived(
		`<script>(function(){document.documentElement.classList.add(${safeJson(accentColor)},${safeJson(baseColor)});})();<` +
			'/script>'
	);
</script>

<svelte:head>
	{@html script}
</svelte:head>
