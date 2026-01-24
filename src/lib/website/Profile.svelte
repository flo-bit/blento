<script lang="ts">
	import { marked } from 'marked';
	import { user, login } from '$lib/atproto';
	import { Button } from '@foxui/core';
	import { BlueskyLogin } from '@foxui/social';
	import { env } from '$env/dynamic/public';
	import type { WebsiteData } from '$lib/types';
	import { getDescription, getName } from '$lib/helper';
	import { page } from '$app/state';
	import type { ActorIdentifier } from '@atcute/lexicons';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';

	let {
		data,
		showEditButton = false
	}: {
		data: WebsiteData;
		showEditButton?: boolean;
	} = $props();

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title}">${text}</a>`;

	const profileUrl = $derived(`${page.url.origin}/${data.handle}`);
</script>

<!-- lg:fixed lg:h-screen lg:w-1/4 lg:max-w-none lg:px-12 lg:pt-24 xl:w-1/3 -->
<div
	class="mx-auto flex max-w-lg flex-col justify-between px-8 @5xl/wrapper:fixed @5xl/wrapper:h-screen @5xl/wrapper:w-1/4 @5xl/wrapper:max-w-none @5xl/wrapper:px-12"
>
	<div class="flex flex-col gap-4 pt-16 pb-8 @5xl/wrapper:h-screen @5xl/wrapper:pt-24">
		<a
			href={profileUrl}
			class="w-fit"
			use:qrOverlay={{
				context: {
					title: getName(data) + "'s blento"
				}
			}}
		>
			{#if data.profile.avatar}
				<img
					class="border-base-400 dark:border-base-800 size-32 rounded-full border @5xl/wrapper:size-44"
					src={data.profile.avatar}
					alt=""
				/>
			{:else}
				<div class="bg-base-300 dark:bg-base-700 size-32 rounded-full @5xl/wrapper:size-44"></div>
			{/if}
		</a>

		<div class="text-4xl font-bold wrap-anywhere">
			{getName(data)}
		</div>

		<div class="scrollbar -mx-4 grow overflow-x-hidden overflow-y-scroll px-4">
			<div
				class="text-base-600 dark:text-base-400 prose dark:prose-invert prose-a:text-accent-500 prose-a:no-underline"
			>
				{@html marked.parse(getDescription(data), {
					renderer
				})}
			</div>
		</div>

		{#if showEditButton && user.isLoggedIn && user.profile?.did === data.did}
			<div>
				<Button href="{page.url}/edit" class="mt-2">
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
		{:else}
			<div class="h-10.5 w-1 @5xl/wrapper:hidden"></div>
		{/if}

		{#if !env.PUBLIC_IS_SELFHOSTED && data.handle === 'blento.app' && user.profile?.handle !== data.handle}
			{#if !user.isInitializing && !user.isLoggedIn}
				<div>
					<div class="my-4 text-sm">
						To create your own blento, sign in with your bluesky account
					</div>
					<BlueskyLogin
						login={async (handle) => {
							await login(handle as ActorIdentifier);
							return true;
						}}
					/>
				</div>
			{:else if user.isLoggedIn}
				<div>
					<Button href="/{env.PUBLIC_IS_SELFHOSTED ? '' : user.profile?.handle}/edit" class="mt-2">
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

						Edit Your Blento</Button
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
