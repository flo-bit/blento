<script lang="ts">
	import ThemeScript from './ThemeScript.svelte';

	let {
		favicon,
		title,
		image,
		description,
		accentColor,
		baseColor
	}: {
		favicon: string | null;
		title: string | null;
		image?: string;
		description?: string;
		accentColor?: string;
		baseColor?: string;
	} = $props();
</script>

<ThemeScript {accentColor} {baseColor} />

<svelte:head>
	{#if favicon}
		<link rel="icon" href={favicon} />
	{/if}

	{#if title}
		<title>{title}</title>
		<meta property="og:title" content={title} />
		<meta name="twitter:title" content={title} />
	{/if}

	{#if image}
		<meta property="og:image" content={image} />
		<meta name="twitter:image" content={image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}

	{#if description}
		<meta name="description" content={description} />
		<meta property="og:description" content={description} />
		<meta name="twitter:description" content={description} />
	{/if}
</svelte:head>
