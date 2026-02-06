<script lang="ts">
	import EditableWebsite from '$lib/website/EditableWebsite.svelte';
	let { data } = $props();
</script>

<EditableWebsite {data} />
