<script lang="ts">
	import MadeWithBlento from '$lib/website/MadeWithBlento.svelte';

	let { children } = $props();
</script>

<div
	class="bg-base-100 dark:bg-base-950 text-base-900 dark:text-base-50 min-h-screen px-4 py-12 lg:px-8"
>
	<div class="mx-auto max-w-3xl">
		<a
			href="/"
			class="text-base-500 hover:text-base-900 dark:hover:text-base-100 mb-8 inline-block text-sm transition-colors"
		>
			&larr; Back to blento
		</a>

		<article
			class="prose prose-base-900 dark:prose-invert prose-headings:font-bold prose-a:text-accent-600 dark:prose-a:text-accent-400 max-w-none"
		>
			{@render children()}
		</article>

		<MadeWithBlento class="text-base-500 mt-16 text-center" />
	</div>
</div>
