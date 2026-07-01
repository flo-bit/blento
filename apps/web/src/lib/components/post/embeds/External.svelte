<script lang="ts">
	import type { PostEmbedExternal } from '..';

	const { data }: { data: PostEmbedExternal } = $props();

	// svelte-ignore state_referenced_locally
	const domain = new URL(data.external.href).hostname.replace('www.', '');
</script>

<article
	class={[
		'group dark:bg-base-900 bg-base-200 border-base-300 dark:border-base-600/30 relative isolate flex max-w-md flex-col justify-end overflow-hidden rounded-2xl border p-4',
		data.external.thumb ? 'aspect-video' : ''
	]}
>
	{#if data.external.thumb}
		<img
			src={data.external.thumb}
			alt={data.external.description}
			class="absolute inset-0 -z-10 size-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-102"
		/>
	{/if}
	<div
		class="dark:from-base-950/90 dark:via-base-950/40 from-base-50/90 via-base-50/40 absolute inset-0 -z-10 bg-linear-to-t"
	></div>

	<div
		class="text-base-700 dark:text-base-300 flex flex-wrap items-center gap-y-1 overflow-hidden text-sm"
	>
		<div>{domain}</div>
	</div>
	<h3
		class="dark:text-base-50 text-base-900 group-hover:text-accent-600 dark:group-hover:text-accent-400 mt-1 text-lg/6 font-semibold transition-colors duration-200"
	>
		<a href={data.external.href} target="_blank" rel="noopener noreferrer nofollow">
			<span class="absolute inset-0"></span>
			{data.external.title}
		</a>
	</h3>
</article>
