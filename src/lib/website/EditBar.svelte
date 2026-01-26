<script lang="ts">
	import { dev } from '$app/environment';
	import { user } from '$lib/atproto';
	import type { WebsiteData } from '$lib/types';
	import { Button, Input, Navbar, Popover, Toggle, toast } from '@foxui/core';

	let {
		data,
		linkValue = $bindable(),
		newCard,
		addLink,

		showingMobileView = $bindable(),
		isSaving = $bindable(),
		hasUnsavedChanges,

		save,

		handleImageInputChange,
		handleVideoInputChange
	}: {
		data: WebsiteData;
		linkValue: string;
		newCard: (type: string) => void;
		addLink: (url: string) => void;

		showingMobileView: boolean;

		isSaving: boolean;
		hasUnsavedChanges: boolean;

		save: () => Promise<void>;

		handleImageInputChange: (evt: Event) => void;
		handleVideoInputChange: (evt: Event) => void;
	} = $props();

	let linkPopoverOpen = $state(false);

	let imageInputRef: HTMLInputElement | undefined = $state();
	let videoInputRef: HTMLInputElement | undefined = $state();

	function getShareUrl() {
		const base = typeof window !== 'undefined' ? window.location.origin : '';
		const pagePath =
			data.page && data.page !== 'blento.self' ? `/${data.page.replace('blento.', '')}` : '';
		return `${base}/${data.handle}${pagePath}`;
	}

	async function copyShareLink() {
		const url = getShareUrl();
		await navigator.clipboard.writeText(url);
		toast.success('Link copied to clipboard!');
	}
</script>

<input
	type="file"
	accept="image/*"
	onchange={handleImageInputChange}
	class="hidden"
	multiple
	bind:this={imageInputRef}
/>

<input
	type="file"
	accept="video/*"
	onchange={handleVideoInputChange}
	class="hidden"
	multiple
	bind:this={videoInputRef}
/>

{#if dev || (user.isLoggedIn && user.profile?.did === data.did)}
	<Navbar
		class={[
			'dark:bg-base-900 bg-base-100 top-auto bottom-2 mx-4 mt-3 max-w-3xl rounded-full px-4 md:mx-auto lg:inline-flex',
			!dev ? 'hidden' : ''
		]}
	>
		<div class="flex items-center gap-2">
			<Button
				size="iconLg"
				variant="ghost"
				class="backdrop-blur-none"
				onclick={() => {
					newCard('section');
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M6 12h12" /><path d="M6 20V4" /><path d="M18 20V4" /></svg
				>
			</Button>

			<Button
				size="iconLg"
				variant="ghost"
				class="backdrop-blur-none"
				onclick={() => {
					newCard('text');
				}}
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
					><path
						fill="none"
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="m15 16l2.536-7.328a1.02 1.02 1 0 1 1.928 0L22 16m-6.303-2h5.606M2 16l4.039-9.69a.5.5 0 0 1 .923 0L11 16m-7.696-3h6.392"
					/></svg
				>
			</Button>

			<Popover sideOffset={16} bind:open={linkPopoverOpen} class="bg-base-100 dark:bg-base-900">
				{#snippet child({ props })}
					<Button
						size="iconLg"
						variant="ghost"
						class="backdrop-blur-none"
						onclick={() => {
							newCard('link');
						}}
						{...props}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="-2 -2 28 28"
							stroke-width="2"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
							/>
						</svg>
					</Button>
				{/snippet}
				<Input
					spellcheck={false}
					type="url"
					bind:value={linkValue}
					onkeydown={(event) => {
						if (event.code === 'Enter') {
							addLink(linkValue);
							event.preventDefault();
						}
					}}
					placeholder="Enter link"
				/>
				<Button onclick={() => addLink(linkValue)} size="icon"
					><svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="size-6"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
					</svg>
				</Button>
			</Popover>

			<Button
				size="iconLg"
				variant="ghost"
				class="backdrop-blur-none"
				onclick={() => {
					imageInputRef?.click();
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
					/>
				</svg>
			</Button>

			{#if dev}
				<Button
					size="iconLg"
					variant="ghost"
					class="backdrop-blur-none"
					onclick={() => {
						videoInputRef?.click();
					}}
				>
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
							d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
						/>
					</svg>
				</Button>
			{/if}

			<Button size="iconLg" variant="ghost" class="backdrop-blur-none" popovertarget="mobile-menu">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
			</Button>
		</div>
		<div class="flex items-center gap-2">
			<Toggle
				class="hidden bg-transparent backdrop-blur-none lg:block dark:bg-transparent"
				bind:pressed={showingMobileView}
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
						d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
					/>
				</svg>
			</Toggle>
			{#if hasUnsavedChanges}
				<Button
					disabled={isSaving}
					onclick={async () => {
						save();
					}}>{isSaving ? 'Saving...' : 'Save'}</Button
				>
			{:else}
				<Button onclick={copyShareLink}>
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
							d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
						/>
					</svg>
					Share
				</Button>
			{/if}
		</div>
	</Navbar>
{/if}
