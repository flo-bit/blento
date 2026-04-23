<script lang="ts">
	import Website from '$lib/website/Website.svelte';

	let { data } = $props();
</script>

<Website {data} />
