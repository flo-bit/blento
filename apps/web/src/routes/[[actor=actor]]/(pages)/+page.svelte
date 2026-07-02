<script lang="ts">
	import Website from '$lib/website/view/Website.svelte';

	let { data } = $props();

	$inspect(data, 'data');
</script>

<Website {data} />
