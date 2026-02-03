<script lang="ts">
	import DateTime from './DateTime.svelte';

	let {
		title,
		date,
		description,
		href
	}: { title: string; date: string; description: string; href: string } = $props();
</script>

<article class="group/article relative isolate flex flex-col">
	<div class="text-base-500 accent:text-accent-950 flex shrink-0 items-center gap-x-4 text-xs">
		<DateTime date={new Date(date)} />
	</div>
	<div class="max-w-xl">
		<div class="text-base-900 dark:text-base-50 mt-3 text-lg leading-6 font-semibold">
			<a {href} target="_blank">
				<span class="absolute inset-0"></span>
				{title}
			</a>

			<div
				class="bg-base-200/30 accent:bg-accent-200/20 dark:bg-base-800/30 absolute -inset-2 -z-10 scale-95 rounded-2xl opacity-0 transition-all duration-150 group-hover/article:scale-100 group-hover/article:opacity-100"
			></div>
		</div>
		<p class="text-base-600 dark:text-base-400 accent:text-base-800 mt-5 text-sm leading-6">
			{description}
		</p>
	</div>
</article>
