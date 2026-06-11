<script lang="ts">
	import EditableWebsite from '$lib/website/edit/EditableWebsite.svelte';
	import { buildTestData, loadAllAdditionalData } from '../build-data';

	const data = buildTestData();
	const ready = loadAllAdditionalData(data).then(() => data);
</script>

<svelte:head>
	<title>Card test · edit</title>
</svelte:head>

{#await ready}
	<div class="p-8 text-sm opacity-60">Loading card data…</div>
{:then loaded}
	<EditableWebsite data={loaded} />
{/await}
