<script lang="ts">
	import ThemeScript from '$lib/website/ThemeScript.svelte';

	let { data, children } = $props();
</script>

<ThemeScript accentColor={data.accentColor} baseColor={data.baseColor} />

{@render children()}
