<script lang="ts">
	import Head from './Head.svelte';

	import { marked } from 'marked';
	import { client, login } from './oauth';
	import { Button, Subheading } from '@foxui/core';
	import { BlueskyLogin } from '@foxui/social';
	import { env } from '$env/dynamic/public';
	let {
		handle,
		did,
		data,
		showEditButton = false
	}: { handle: string; did: string; data: any; showEditButton?: boolean } = $props();

	// svelte-ignore state_referenced_locally
	const profileData = data?.data?.['app.bsky.actor.profile']?.self?.value;

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title}">${text}</a>`;
</script>

<Head
	favicon={profileData?.avatar?.ref?.$link ? 'https://cdn.bsky.app/img/avatar/plain/' + did + '/' + profileData.avatar.ref.$link : null}
	title={profileData?.displayName || handle}
	image={'/' + handle + '/og.png'}
/>

<!-- lg:fixed lg:h-screen lg:w-1/4 lg:max-w-none lg:px-12 lg:pt-24 xl:w-1/3 -->
<div
	class="mx-auto flex max-w-2xl flex-col justify-between px-8 @5xl/wrapper:fixed @5xl/wrapper:h-screen @5xl/wrapper:w-1/4 @5xl/wrapper:max-w-none @5xl/wrapper:px-12"
>
	<div class="flex flex-col gap-4 pt-16 pb-8 @5xl/wrapper:h-screen @5xl/wrapper:pt-24">
		{#if profileData?.avatar?.ref?.$link}
			<img
				class="size-32 rounded-full @5xl/wrapper:size-44"
				src={'https://cdn.bsky.app/img/avatar/plain/' + did + '/' + profileData.avatar.ref.$link}
				alt=""
			/>
		{:else}
			<div class="bg-base-300 dark:bg-base-700 size-32 rounded-full @5xl/wrapper:size-44"></div>
		{/if}
		<div class="text-4xl font-bold wrap-anywhere">
			{profileData?.displayName || handle}
		</div>

		<div class="scrollbar -mx-4 flex-grow overflow-y-scroll px-4 overflow-x-hidden">
			<div
				class="text-base-600 dark:text-base-400 prose dark:prose-invert prose-a:text-accent-500 prose-a:no-underline"
			>
				{@html marked.parse(profileData?.description ?? '', { renderer })}
			</div>
		</div>

		{#if showEditButton && client.isLoggedIn && client.profile?.did === did}
			<div>
				<Button href="{env.PUBLIC_IS_SELFHOSTED ? '' : client.profile?.handle}/edit" class="mt-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
						/>
					</svg>

					Edit Your Website</Button
				>
			</div>
		{/if}

		{#if !env.PUBLIC_IS_SELFHOSTED && handle === 'blento.app' && client.profile?.handle !== handle}
			{#if !client.isInitializing && !client.isLoggedIn}
				<div>
					<div class="my-4 text-sm">
						To create your own blento, sign in with your bluesky account
					</div>
					<BlueskyLogin
						login={async (handle) => {
							await login(handle);
							return true;
						}}
					/>
				</div>
			{:else if client.isLoggedIn}
				<div>
					<Button href={'/' + client.profile?.handle} class="mt-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
							/>
						</svg>

						Open Your Blento</Button
					>
				</div>
			{/if}
		{/if}
		<div class="hidden text-xs font-light @5xl/wrapper:block">
			made with <a
				href="https://blento.app"
				target="_blank"
				class="hover:text-accent-600 dark:hover:text-accent-400 font-medium transition-colors duration-200"
				>blento</a
			>
		</div>
	</div>
</div>

<style>
	.scrollbar::-webkit-scrollbar-track {
		background-color: transparent;
	}

	@supports (scrollbar-width: auto) {
		.scrollbar {
			scrollbar-color: var(--color-base-400) transparent;
			scrollbar-width: thin;
		}

		:global(.dark .scrollbar) {
			scrollbar-color: var(--color-base-800) transparent;
		}
	}

	@supports not (scrollbar-width: auto) {
		:global(.scrollbar::-webkit-scrollbar) {
			width: 14px;
			height: 14px;
		}
	}

	.scrollbar::-webkit-scrollbar-thumb {
		background-color: var(--color-base-400);
		border-radius: 20px;
		border: 4px solid transparent;
		background-clip: content-box;
	}

	.scrollbar::-webkit-scrollbar-thumb:hover {
		background-color: var(--color-base-500);
	}

	/* Dark mode rules */
	:global(.dark .scrollbar::-webkit-scrollbar-thumb) {
		background-color: var(--color-base-800);
	}

	:global(.dark .scrollbar::-webkit-scrollbar-thumb:hover) {
		background-color: var(--color-base-700);
	}
</style>
