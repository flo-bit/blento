<script lang="ts">
	let {
		images,
		alt = '',
		size = 'medium'
	}: { images?: { '#text': string; size: string }[]; alt?: string; size?: string } = $props();

	let isLoading = $state(true);
	let hasError = $state(false);

	const imageUrl = $derived.by(() => {
		if (!images || images.length === 0) return '';
		const preferred = ['extralarge', 'large', 'medium', 'small'];
		for (const pref of preferred) {
			const img = images.find((i) => i.size === pref);
			if (img?.['#text']) return img['#text'];
		}
		return images[images.length - 1]?.['#text'] || '';
	});
</script>

{#if !imageUrl || hasError}
	<div
		class="bg-base-200 dark:bg-base-700 accent:bg-accent-700/50 flex h-full w-full items-center justify-center rounded-lg"
	>
		<svg
			class="text-base-500 dark:text-base-400 accent:text-accent-200 h-5 w-5"
			fill="currentColor"
			viewBox="0 0 20 20"
		>
			<path
				d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
			/>
		</svg>
	</div>
{:else}
	{#if isLoading}
		<div class="bg-base-200 dark:bg-base-800 h-full w-full animate-pulse rounded-lg"></div>
	{/if}
	<img
		src={imageUrl}
		{alt}
		class="h-full w-full rounded-lg object-cover {isLoading && 'hidden'}"
		onload={() => (isLoading = false)}
		onerror={() => {
			isLoading = false;
			hasError = true;
		}}
	/>
{/if}
