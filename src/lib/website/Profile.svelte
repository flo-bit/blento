<script lang="ts">
	import { marked } from 'marked';
	import { sanitize } from '$lib/sanitize';
	import type { WebsiteData } from '$lib/types';
	import { getDescription, getImage, getName, getProfilePosition } from '$lib/helper';
	import { page } from '$app/state';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';
	import MadeWithBlento from './MadeWithBlento.svelte';
	import { Avatar } from '@foxui/core';
	import Pronouns from '../components/Pronouns.svelte';

	let {
		data
	}: {
		data: WebsiteData;
	} = $props();

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title ?? ''}">${text}</a>`;

	const profileUrl = $derived.by(() => {
		if (page.data.customDomain) return `${page.url.origin}/`;
		const pubUrl = data.publication?.url;
		if (
			pubUrl &&
			/^https?:\/\//.test(pubUrl) &&
			!/^https?:\/\/([^/]*\.)?blento\.app/i.test(pubUrl)
		) {
			return pubUrl;
		}
		const handle = data.profile?.handle;
		const actor = handle && handle !== 'handle.invalid' ? handle : data.did;
		return `${page.url.origin}/${actor}`;
	});
	const profilePosition = $derived(getProfilePosition(data));
</script>

<!-- lg:fixed lg:h-screen lg:w-1/4 lg:max-w-none lg:px-12 lg:pt-24 xl:w-1/3 -->
<div
	class={[
		'mx-auto flex max-w-lg flex-col justify-between px-8',
		profilePosition === 'side'
			? '@5xl/wrapper:fixed @5xl/wrapper:h-screen @5xl/wrapper:w-1/4 @5xl/wrapper:max-w-none @5xl/wrapper:px-12'
			: '@5xl/wrapper:max-w-4xl @5xl/wrapper:px-12'
	]}
>
	<div
		class={[
			'flex flex-col gap-4 pt-10 pb-0',
			profilePosition === 'side' && '@5xl/wrapper:h-screen @5xl/wrapper:pt-12'
		]}
	>
		<a
			href={profileUrl}
			class="w-fit"
			use:qrOverlay={{
				context: {
					title: getName(data) + "'s blento"
				}
			}}
		>
			<Avatar
				src={getImage(data.publication, data.did, 'icon') || data.profile.avatar}
				class={[
					'border-base-400 dark:border-base-800 size-32 shrink-0 rounded-full border object-cover',
					profilePosition === 'side' && '@5xl/wrapper:size-44'
				]}
			/>
		</a>

		<div class="text-4xl font-bold wrap-anywhere">
			{getName(data)}
		</div>

		{#if data.pronounsRecord?.value?.sets?.length}
			<Pronouns {data} />
		{/if}

		<div class="scrollbar -mx-4 grow overflow-x-hidden overflow-y-scroll px-4">
			<div
				class="text-base-600 dark:text-base-400 prose dark:prose-invert prose-a:text-accent-500 prose-a:no-underline whitespace-pre-wrap"
			>
				{@html sanitize(
					marked.parse(getDescription(data), {
						renderer
					}) as string,
					{ ADD_ATTR: ['target'] }
				)}
			</div>
		</div>

		<MadeWithBlento class="hidden {profilePosition === 'side' && '@5xl/wrapper:block'}" />
	</div>
</div>
