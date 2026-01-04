<script lang="ts">
	import Head from './Head.svelte';

	import { marked } from 'marked';
	import { client } from './oauth';
	import { Button } from '@foxui/core';
	let {
		handle,
		did,
		data,
		showEditButton = false
	}: { handle: string; did: string; data: any; showEditButton?: boolean } = $props();
	$inspect(data);

	// svelte-ignore state_referenced_locally
	const profileData = data?.data?.['app.bsky.actor.profile']?.self?.value;

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title}">${text}</a>`;
</script>

<!-- lg:fixed lg:h-screen lg:w-1/4 lg:max-w-none lg:px-12 lg:pt-24 xl:w-1/3 -->
<div
	class="mx-auto flex max-w-2xl px-10 pt-16 pb-8 @5xl/wrapper:fixed @5xl/wrapper:h-screen @5xl/wrapper:w-1/4 @5xl/wrapper:max-w-none @5xl/wrapper:px-12 @5xl/wrapper:pt-24 @7xl/wrapper:w-1/3"
>
	<div class="flex flex-col gap-4">
		<Head
			favicon={'https://cdn.bsky.app/img/avatar/plain/' + did + '/' + profileData?.avatar.ref.$link}
			title={(profileData?.displayName ?? handle) + "'s blento"}
		/>
		<img
			class="rounded-fulll size-32 rounded-full @5xl/wrapper:size-44"
			src={'https://cdn.bsky.app/img/avatar/plain/' + did + '/' + profileData?.avatar.ref.$link}
			alt=""
		/>
		<div class="line-clamp-2 text-4xl font-bold wrap-anywhere">{(profileData?.displayName ?? handle)}</div>

		<div
			class="text-base-600 dark:text-base-400 prose dark:prose-invert prose-a:text-accent-500 prose-a:no-underline line-clamp-3"
		>
			{@html marked.parse(profileData.description ?? '', { renderer })}
		</div>

		{#if showEditButton && client.isLoggedIn && client.profile?.did === did}
			<div>
				<Button href="./edit" class="mt-2">
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
	</div>
</div>
