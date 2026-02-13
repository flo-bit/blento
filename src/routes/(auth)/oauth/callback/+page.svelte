<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/atproto';
	import { getHandleOrDid } from '$lib/atproto/methods';

	let showError = $state(false);

	let startedErrorTimer = $state();

	let hasRedirected = $state(false);

	$effect(() => {
		if (user.profile) {
			if (hasRedirected) return;

			const redirect = localStorage.getItem('login-redirect');
			localStorage.removeItem('login-redirect');
			console.log('redirect', redirect);
			goto(redirect || '/' + getHandleOrDid(user.profile) + '/edit', {});

			hasRedirected = true;
		}

		if (!user.isInitializing && !startedErrorTimer) {
			startedErrorTimer = true;

			setTimeout(() => {
				showError = true;
			}, 5000);
		}
	});
</script>

{#if !showError}
	<div class="flex min-h-screen w-full items-center justify-center text-3xl">Loading...</div>
{:else}
	<div class="flex min-h-screen w-full items-center justify-center text-3xl">
		<span class="max-w-xl text-center font-medium"
			>There was an error signing you in, please go back to the
			<a class="text-accent-600 dark:text-accent-400" href="/">homepage</a>
			and try again.
		</span>
	</div>
{/if}
