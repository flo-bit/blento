<script lang="ts">
	import type { WebsiteData } from '$lib/types';
	import { getImage, compressImage, getProfilePosition } from '$lib/helper';
	import PlainTextEditor from '$lib/components/PlainTextEditor.svelte';
	import MarkdownTextEditor from '$lib/components/MarkdownTextEditor.svelte';
	import { Avatar, Button } from '@foxui/core';
	import { getIsMobile } from './context';
	import MadeWithBlento from './MadeWithBlento.svelte';
	import { SelectThemePopover } from '$lib/components/select-theme';

	let { data = $bindable(), hideBlento = false }: { data: WebsiteData; hideBlento?: boolean } =
		$props();

	let fileInput: HTMLInputElement;
	let isHoveringAvatar = $state(false);

	async function handleAvatarChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		try {
			const compressedBlob = await compressImage(file);
			const objectUrl = URL.createObjectURL(compressedBlob);

			data.publication.icon = {
				blob: compressedBlob,
				objectUrl
			} as any;

			data = { ...data };
		} catch (error) {
			console.error('Failed to process image:', error);
		}
	}

	function getAvatarUrl(): string | undefined {
		const customIcon = getImage(data.publication, data.did, 'icon');
		if (customIcon) return customIcon;
		return data.profile.avatar;
	}

	function handleFileInputClick() {
		fileInput.click();
	}

	let profilePosition = $derived(getProfilePosition(data));
</script>

<div
	class={[
		'relative mx-auto flex max-w-lg flex-col justify-between px-8',
		profilePosition === 'side'
			? '@5xl/wrapper:fixed @5xl/wrapper:h-screen @5xl/wrapper:w-1/4 @5xl/wrapper:max-w-none @5xl/wrapper:px-12'
			: '@5xl/wrapper:max-w-4xl @5xl/wrapper:px-12'
	]}
>
	<div
		class={[
			'flex flex-col gap-4 pt-16 pb-4',
			profilePosition === 'side' && '@5xl/wrapper:h-screen @5xl/wrapper:pt-24'
		]}
	>
		<!-- Avatar with edit capability -->
		<button
			type="button"
			class={[
				'group relative size-32 shrink-0 cursor-pointer overflow-hidden rounded-full',
				profilePosition === 'side' && '@5xl/wrapper:size-44'
			]}
			onmouseenter={() => (isHoveringAvatar = true)}
			onmouseleave={() => (isHoveringAvatar = false)}
			onclick={handleFileInputClick}
		>
			<Avatar
				src={getAvatarUrl()}
				class={[
					'border-base-400 dark:border-base-800 size-32 shrink-0 rounded-full border object-cover',
					profilePosition === 'side' && '@5xl/wrapper:size-44'
				]}
			/>

			<!-- Hover overlay -->
			<div
				class={[
					'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity duration-200',
					isHoveringAvatar ? 'opacity-100' : 'opacity-0'
				]}
			>
				<div class="text-center text-sm text-white">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="mx-auto mb-1 size-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
						/>
					</svg>
					<span class="font-medium">Click to change</span>
				</div>
			</div>
		</button>

		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			class="hidden"
			onchange={handleAvatarChange}
		/>

		<!-- Editable Name -->
		{#if data.publication}
			<div class="text-4xl font-bold wrap-anywhere">
				<PlainTextEditor bind:contentDict={data.publication} key="name" placeholder="Your name" />
			</div>
		{/if}

		<!-- Editable Description -->
		<div class="scrollbar -mx-4 grow overflow-x-hidden overflow-y-scroll px-4">
			{#if data.publication}
				<MarkdownTextEditor
					bind:contentDict={data.publication}
					key="description"
					placeholder="Something about me..."
					class="text-base-600 dark:text-base-400 prose dark:prose-invert prose-a:text-accent-500 prose-a:no-underline"
				/>
			{/if}
		</div>

		{#if !hideBlento}
			<MadeWithBlento class="hidden {profilePosition === 'side' && '@5xl/wrapper:block'}" />
		{/if}
	</div>
</div>
