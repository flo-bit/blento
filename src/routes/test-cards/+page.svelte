<script lang="ts">
	import Website from '$lib/website/view/Website.svelte';
	import { buildTestData, loadAllAdditionalData } from './build-data';

	const data = buildTestData();
	const ready = loadAllAdditionalData(data).then(() => data);
</script>

<svelte:head>
	<title>Card test · view</title>
</svelte:head>

{#await ready}
	<div class="p-8 text-sm opacity-60">Loading card data…</div>
{:then loaded}
	<Website data={loaded} />
{/await}
