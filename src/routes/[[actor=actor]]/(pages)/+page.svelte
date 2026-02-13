<script lang="ts">
	import { refreshData } from '$lib/helper.js';
	import Website from '$lib/website/Website.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		refreshData(data);
	});
</script>

<Website {data} />
