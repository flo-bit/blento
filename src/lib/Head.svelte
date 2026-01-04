<script lang="ts">
	let { favicon, title }: { favicon: string | null; title: string | null } = $props();
</script>

<svelte:head>
	{#if favicon}
		<link rel="icon" href={favicon} />
	{/if}

	{#if title}
		<title>{title}</title>
	{/if}
</svelte:head>
