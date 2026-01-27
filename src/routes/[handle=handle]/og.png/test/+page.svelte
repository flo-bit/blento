<script>
	import OGImage from '../OGImage.svelte';

	let { data } = $props();
</script>

<OGImage items={data.cards} name={data.handle} avatar={data.profile.avatar} />
