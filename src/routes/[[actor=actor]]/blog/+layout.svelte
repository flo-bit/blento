<script lang="ts">
	import ThemeScript from '$lib/website/view/ThemeScript.svelte';

	let { data, children } = $props();
</script>

<ThemeScript accentColor={data.accentColor} baseColor={data.baseColor} />

{@render children()}
