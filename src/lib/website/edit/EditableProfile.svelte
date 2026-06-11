<script lang="ts">
	import type { WebsiteData } from '$lib/types';
	import { getImage, compressImage } from '$lib/helpers/images';
	import { getProfilePosition } from '$lib/helpers/website';
	import PlainTextEditor from '$lib/components/PlainTextEditor.svelte';
	import MarkdownTextEditor from '$lib/components/MarkdownTextEditor.svelte';
	import { Avatar } from '@foxui/core';
	import MadeWithBlento from '../view/MadeWithBlento.svelte';
	import Pronouns from '../../components/Pronouns.svelte';

	let { data = $bindable(), hideBlento = false }: { data: WebsiteData; hideBlento?: boolean } =
		$props();

	let fileInput: HTMLInputElement;
	let isHoveringAvatar = $state(false);

	function hideProfile() {
		data.publication.preferences ??= {};
		data.publication.preferences.hideProfileSection = true;
		data = { ...data };
	}

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

	function onTextUpdate() {
		data = { ...data };
	}
</script>

<div
	class={[
		'relative mx-auto flex max-w-lg flex-col justify-between px-8',
		profilePosition === 'side'
			? '@5xl/wrapper:fixed @5xl/wrapper:h-[calc(100vh-3.5rem)] @5xl/wrapper:w-1/4 @5xl/wrapper:max-w-none @5xl/wrapper:px-12'
			: '@5xl/wrapper:max-w-4xl @5xl/wrapper:px-12'
	]}
>
	<div
		class={[
			'flex flex-col gap-4 pt-10 pb-0',
			profilePosition === 'side' && '@5xl/wrapper:h-[calc(100vh-3.5rem)] @5xl/wrapper:pt-12'
		]}
	>
		<!-- Avatar with edit capability -->
		<div
			class={[
				'relative size-32 w-fit shrink-0',
				profilePosition === 'side' && '@5xl/wrapper:size-44'
			]}
		>
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

			<button
				type="button"
				class="bg-base-100 dark:bg-base-900 border-base-200 dark:border-base-800 text-base-600 dark:text-base-400 hover:text-accent-600 dark:hover:text-accent-400 absolute top-0 left-0 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full border shadow-md transition-colors"
				aria-label="Hide profile"
				title="Hide profile"
				onclick={hideProfile}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="size-4"
				>
					<path
						d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
					/>
					<line x1="2" x2="22" y1="2" y2="22" />
				</svg>
			</button>
		</div>

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
				<PlainTextEditor
					bind:contentDict={data.publication}
					key="name"
					placeholder="Your name"
					onupdate={onTextUpdate}
				/>
			</div>
		{/if}

		<Pronouns bind:data editing />

		<!-- Editable Description -->
		<div class="scrollbar -mx-4 grow overflow-x-hidden overflow-y-scroll px-4">
			{#if data.publication}
				<MarkdownTextEditor
					bind:contentDict={data.publication}
					key="description"
					placeholder="Something about me..."
					class="text-base-600 dark:text-base-400 prose dark:prose-invert prose-a:text-accent-500 prose-a:no-underline"
					onupdate={onTextUpdate}
				/>
			{/if}
		</div>

		{#if !hideBlento}
			<MadeWithBlento class="hidden pb-8 {profilePosition === 'side' && '@5xl/wrapper:block'}" />
		{/if}
	</div>
</div>
