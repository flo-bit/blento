<script lang="ts">
	import { client, login, logout } from '$lib/oauth';
	import type { WebsiteData } from '$lib/types';
	import { Button, Popover } from '@foxui/core';

	let {
		data
	}: {
		data: WebsiteData;
	} = $props();

	let settingsPopoverOpen = $state(false);
</script>

{#if client.isLoggedIn && client.profile}
	<div class="fixed top-4 right-4 z-20">
		<Popover sideOffset={8} bind:open={settingsPopoverOpen} class="bg-base-100 dark:bg-base-900">
			{#snippet child({ props })}
				<button {...props}>
					<img src={client.profile?.avatar} alt="" class="size-15 rounded-full" />
				</button>
			{/snippet}

			<Button variant="ghost" onclick={logout}>Logout</Button>
		</Popover>
	</div>
{:else}
	<div
		class="dark:bg-base-950 border-base-200 dark:border-base-900 fixed top-4 right-4 z-20 flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-lg"
	>
		<span class="text-sm font-semibold">Login to edit your page</span>

		<Button
			onclick={async () => {
				await login(data.handle);
			}}>Login</Button
		>
	</div>
{/if}
