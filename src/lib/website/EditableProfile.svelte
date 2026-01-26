<script lang="ts">
	import type { WebsiteData } from '$lib/types';
	import { getImage, compressImage, getProfilePosition } from '$lib/helper';
	import PlainTextEditor from '$lib/components/PlainTextEditor.svelte';
	import MarkdownTextEditor from '$lib/components/MarkdownTextEditor.svelte';
	import { Button } from '@foxui/core';
	import { getIsMobile } from './context';
	import type { Editor } from '@tiptap/core';
	import MadeWithBlento from './MadeWithBlento.svelte';

	let { data = $bindable(), hideBlento = false }: { data: WebsiteData; hideBlento?: boolean } =
		$props();

	let profilePosition = $derived(getProfilePosition(data));

	function toggleProfilePosition() {
		data.publication.preferences ??= {};
		data.publication.preferences.profilePosition = profilePosition === 'side' ? 'top' : 'side';
		data = { ...data };
	}

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

	let isMobile = getIsMobile();
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
			'absolute left-2 z-20 flex gap-2',
			profilePosition === 'side' ? 'top-2 left-14' : 'top-2'
		]}
	>
		<Button
			size="icon"
			onclick={() => {
				data.publication.preferences ??= {};
				data.publication.preferences.hideProfileSection = true;
				data = { ...data };
			}}
			variant="ghost"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-6"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
				/>
			</svg>
		</Button>

		<!-- Position toggle button (desktop only) -->
		{#if !isMobile()}
			<Button size="icon" type="button" onclick={toggleProfilePosition} variant="ghost">
				{#if profilePosition === 'side'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25"
						/>
					</svg>
				{/if}
			</Button>
		{/if}
	</div>

	<div
		class={[
			'flex flex-col gap-4 pt-16 pb-8',
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
			{#if getAvatarUrl()}
				<img
					class="border-base-400 dark:border-base-800 size-full shrink-0 rounded-full border object-cover"
					src={getAvatarUrl()}
					alt=""
				/>
			{:else}
				<div class="bg-base-300 dark:bg-base-700 size-full rounded-full"></div>
			{/if}

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

		<div class={['h-10.5 w-1', profilePosition === 'side' && '@5xl/wrapper:hidden']}></div>

		{#if !hideBlento}
			<MadeWithBlento class="hidden {profilePosition === 'side' && '@5xl/wrapper:block'}" />
		{/if}
	</div>
</div>
