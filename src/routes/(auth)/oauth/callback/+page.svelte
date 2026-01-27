<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/atproto';
	import { getHandleOrDid } from '$lib/atproto/methods';

	$effect(() => {
		console.log('hello', user);
		if (user.profile) {
			goto('/' + getHandleOrDid(user.profile) + '/edit', {});
		}
	});
</script>

<div class="flex min-h-screen w-full items-center justify-center text-3xl">Loading...</div>
