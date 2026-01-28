<script lang="ts">
	import { user, login } from '$lib/atproto';
	import { Button } from '@foxui/core';
	import { BlueskyLogin } from '@foxui/social';
	import { env } from '$env/dynamic/public';
	import type { WebsiteData } from '$lib/types';
	import { page } from '$app/state';
	import type { ActorIdentifier } from '@atcute/lexicons';
	import { loginModalState } from '$lib/atproto/UI/LoginModal.svelte';
	import { getHandleOrDid } from '$lib/atproto/methods';

	let { data }: { data: WebsiteData } = $props();

	const isOwnPage = $derived(user.isLoggedIn && user.profile?.did === data.did);
	const isBlento = $derived(!env.PUBLIC_IS_SELFHOSTED && data.handle === 'blento.app');
	const isEditPage = $derived(page.url.pathname.endsWith('/edit'));
	const showLoginOnBlento = $derived(
		isBlento && !user.isInitializing && !user.isLoggedIn && user.profile?.handle !== data.handle
	);
	const showLoginOnEditPage = $derived(isEditPage && !user.isInitializing && !user.isLoggedIn);
	const showEditBlentoButton = $derived(
		isBlento && user.isLoggedIn && user.profile?.handle !== data.handle
	);

	function getUserIdentifier(): ActorIdentifier {
		const id = user.profile ? getHandleOrDid(user.profile) : (data.did as ActorIdentifier);
		return id;
	}
</script>

{#if isOwnPage && !isEditPage}
	<div class="fixed bottom-6 left-6 z-49 hidden lg:block">
		<Button size="lg" href="{page.url}/edit">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
				/>
			</svg>
			Edit Website
		</Button>
	</div>
{:else if showLoginOnEditPage}
	<div class="fixed bottom-6 left-6 z-49">
		<Button size="lg" onclick={() => login(getUserIdentifier())}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
				/>
			</svg>
			Login
		</Button>
	</div>
{:else if showLoginOnBlento}
	<div class="fixed bottom-6 left-6 z-49">
		<Button size="lg" onclick={() => loginModalState.show()}>Login</Button>
	</div>
{:else if showEditBlentoButton}
	<div class="fixed bottom-6 left-6 z-49">
		<Button size="lg" href="/{env.PUBLIC_IS_SELFHOSTED ? '' : getUserIdentifier()}/edit">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
				/>
			</svg>
			Edit Your Blento
		</Button>
	</div>
{/if}
