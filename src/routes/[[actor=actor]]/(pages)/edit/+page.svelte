<script lang="ts">
	import EditableWebsite from '$lib/website/edit/EditableWebsite.svelte';
	let { data } = $props();
</script>

<EditableWebsite {data} />
