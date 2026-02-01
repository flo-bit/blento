<script lang="ts">
	import { goto } from '$app/navigation';
	import { user, login, logout } from '$lib/atproto';
	import { getHandleOrDid } from '$lib/atproto/methods';
	import type { WebsiteData } from '$lib/types';
	import type { ActorIdentifier } from '@atcute/lexicons';
	import { Avatar, Button, Popover } from '@foxui/core';

	let {
		data
	}: {
		data: WebsiteData;
	} = $props();

	let settingsPopoverOpen = $state(false);
</script>

{#if user.isLoggedIn && user.profile}
	<div class="fixed top-4 right-4 z-20">
		<Popover sideOffset={8} bind:open={settingsPopoverOpen} class="bg-base-100 dark:bg-base-900">
			{#snippet child({ props })}
				<button {...props}>
					<Avatar src={user.profile?.avatar} alt="" class="size-15 rounded-full" />
				</button>
			{/snippet}

			<div class="flex flex-col">
				{#if user.profile}
					<Button
						variant="ghost"
						onclick={() => {
							goto('/' + getHandleOrDid(user.profile), {});
						}}>Leave edit mode</Button
					>
				{/if}

				<Button variant="ghost" onclick={logout}>Logout</Button>
			</div>
		</Popover>
	</div>
{/if}
