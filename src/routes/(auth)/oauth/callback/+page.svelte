<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/atproto';
	import { getHandleOrDid } from '$lib/atproto/methods';

	let showError = $state(false);

	let startedErrorTimer = $state();

	$effect(() => {
		if (user.profile) {
			goto('/' + getHandleOrDid(user.profile) + '/edit', {});
		}

		if (!user.isInitializing && !startedErrorTimer) {
			startedErrorTimer = true;

			setTimeout(() => {
				showError = true;
			}, 3000);
		}
	});
</script>

{#if user.isInitializing || !showError}
	<div class="flex min-h-screen w-full items-center justify-center text-3xl">Loading...</div>
{:else if showError}
	<div class="flex min-h-screen w-full items-center justify-center text-3xl">
		<span class="max-w-xl text-center font-medium"
			>There was an error signing you in, please go back to the
			<a class="text-accent-600 dark:text-accent-400" href="/">homepage</a>
			and try again.
		</span>
	</div>
{/if}
