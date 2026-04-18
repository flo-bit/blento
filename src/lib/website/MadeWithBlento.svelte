<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<div class={['text-xs font-light', className]}>
	<div>
		made with <a
			href="https://blento.app"
			target="_blank"
			class="hover:text-accent-600 dark:hover:text-accent-400 font-medium transition-colors duration-200"
			>blento</a
		>
	</div>
	<div class="mt-1">
		<a
			href="/imprint"
			class="hover:text-accent-600 dark:hover:text-accent-400 transition-colors duration-200"
			>Imprint</a
		>
		<span class="mx-1 opacity-50">&middot;</span>
		<a
			href="/privacy"
			class="hover:text-accent-600 dark:hover:text-accent-400 transition-colors duration-200"
			>Privacy</a
		>
	</div>
</div>
