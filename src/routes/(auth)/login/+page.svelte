<script lang="ts">
	import { AtprotoLogin } from '@foxui/social';
	import { login, signup } from '$lib/atproto';
	import type { ActorIdentifier } from '@atcute/lexicons';
	import MadeWithBlento from '$lib/website/MadeWithBlento.svelte';
</script>

<svelte:head>
	<title>Login &middot; blento</title>
	<meta name="description" content="Login to blento with your atmosphere account." />
</svelte:head>

<div
	class="bg-base-100 dark:bg-base-950 text-base-900 dark:text-base-50 flex min-h-screen flex-col px-4 py-12 lg:px-8"
>
	<div class="mx-auto w-full max-w-md flex-1">
		<a
			href="/"
			class="text-base-500 hover:text-base-900 dark:hover:text-base-100 mb-8 inline-block text-sm transition-colors"
		>
			&larr; Back to blento
		</a>

		<div
			class="bg-base-50 dark:bg-base-900 border-base-200 dark:border-base-800 rounded-2xl border p-6 shadow-sm sm:p-8"
		>
			<AtprotoLogin
				login={async (handle) => {
					await login(handle as ActorIdentifier);
					return true;
				}}
				signup={async () => {
					await signup();
					return true;
				}}
			/>
		</div>
	</div>

	<MadeWithBlento class="text-base-500 mt-16 text-center" />
</div>
