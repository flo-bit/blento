<script lang="ts">
	import EmbeddedCard from '$lib/website/EmbeddedCard.svelte';

	let { data } = $props();
</script>

<EmbeddedCard {data} />
