<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		children: () => any;
	};

	let { children, class: className, ...props }: Props = $props();
</script>

<button
	class={[
		'bg-base-300 dark:bg-base-700 dark:text-base-50 dark:hover:bg-base-600 hover:bg-base-200 focus-visible:outline-base-600 text-black transition-colors duration-100',
		'inline-flex cursor-pointer justify-center rounded-full px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	]}
	{...props}
>
	{@render children()}
</button>
