<script lang="ts">
	import { dev } from '$app/environment';
	import { client } from '$lib/oauth';
	import type { WebsiteData } from '$lib/types';
	import { Button, Input, Modal, Navbar, Popover, Toggle } from '@foxui/core';

	let {
		data,
		linkValue = $bindable(),
		newCard,
		addLink,
		showSettings = $bindable(),

		showingMobileView = $bindable(),
		isSaving = $bindable(),

		save,

		handleImageInputChange,
		handleVideoInputChange
	}: {
		data: WebsiteData;
		linkValue: string;
		newCard: (type: string) => void;
		addLink: (url: string) => void;

		showSettings: boolean;

		showingMobileView: boolean;

		isSaving: boolean;

		save: () => Promise<void>;

		handleImageInputChange: (evt: Event) => void;
		handleVideoInputChange: (evt: Event) => void;
	} = $props();

	let linkPopoverOpen = $state(false);

	let imageInputRef: HTMLInputElement | undefined = $state();
	let videoInputRef: HTMLInputElement | undefined = $state();

	let shareModalOpen = $state(false);
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

<Modal bind:open={shareModalOpen}></Modal>

{#if dev || (client.isLoggedIn && client.profile?.did === data.did)}
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
			<Button
				size="iconLg"
				variant="ghost"
				class="backdrop-blur-none"
				onclick={() => {
					showSettings = true;
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
						d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
					/>
				</svg>
			</Button>
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
			<Button
				disabled={isSaving}
				onclick={async () => {
					save();
				}}>{isSaving ? 'Saving...' : 'Save'}</Button
			>
		</div>
	</Navbar>
{/if}
