<script lang="ts">
	let { date }: { date: Date } = $props();
</script>

<time datetime={date.toISOString()}>
	{date.toLocaleDateString('en-us', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	})}
</time>
