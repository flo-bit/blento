<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { logout, user } from '$lib/atproto';
	import { getImage, getName } from '$lib/helper';
	import type { WebsiteData } from '$lib/types';
	import { Avatar, Button, Popover, Toggle } from '@foxui/core';
	import { settingsOverlayState } from './settings/SettingsOverlay.svelte';

	let {
		data,
		showingMobileView = $bindable(),
		isSaving = $bindable(),
		hasUnsavedChanges,
		save
	}: {
		data: WebsiteData;
		showingMobileView: boolean;
		isSaving: boolean;
		hasUnsavedChanges: boolean;
		save: () => Promise<void>;
	} = $props();

	function getPreviewUrl() {
		const base = typeof window !== 'undefined' ? window.location.origin : '';
		const pagePath =
			data.page && data.page !== 'blento.self' ? `/p/${data.page.replace('blento.', '')}` : '';

		if (page.data.customDomain) {
			return `${base}${pagePath || '/'}`;
		}

		const handle = data.profile?.handle;
		const actor = handle && handle !== 'handle.invalid' ? handle : data.did;
		return `${base}/${actor}${pagePath}`;
	}

	function openPreview() {
		if (typeof window === 'undefined') return;
		window.open(getPreviewUrl(), '_blank', 'noopener,noreferrer');
	}

	let avatarUrl = $derived(getImage(data.publication, data.did, 'icon') ?? data.profile.avatar);
	let name = $derived(getName(data));

	let settingsPopoverOpen = $state(false);
</script>

{#if dev || (user.isLoggedIn && user.profile?.did === data.did)}
	<div
		class="bg-base-100 dark:bg-base-950 border-base-200 dark:border-base-800 fixed top-0 right-0 left-0 z-40 flex h-13 items-center justify-between border-b px-4"
	>
		<div class="flex min-w-0 items-center gap-2">
			<Popover
				side="bottom"
				sideOffset={8}
				bind:open={settingsPopoverOpen}
				class="bg-base-100 dark:bg-base-800 m-0 p-1"
			>
				{#snippet child({ props })}
					<button {...props} class="cursor-pointer">
						<Avatar src={avatarUrl} alt={name} class="size-8" />
					</button>
				{/snippet}

				<div class="flex flex-col">
					<Button variant="ghost" onclick={logout}>Logout</Button>
				</div>
			</Popover>

			<span class="text-base-900 dark:text-base-100 truncate text-sm font-semibold" title={name}>
				{name}
			</span>
			<span class="text-base-500 dark:text-base-400 hidden text-xs font-medium sm:inline">
				editing
			</span>
		</div>
		<div class="flex items-center gap-1">
			<Button size="sm" variant="ghost" class="backdrop-blur-none" onclick={openPreview}>
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
					<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
					<circle cx="12" cy="12" r="3" />
				</svg>
				<span class="hidden sm:inline">Preview</span>
			</Button>
			<Toggle
				class="hidden bg-transparent backdrop-blur-none lg:inline-flex dark:bg-transparent"
				bind:pressed={showingMobileView}
				aria-label="Toggle mobile preview"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="size-5"
				>
					<rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
					<path d="M12 18h.01" />
				</svg>
			</Toggle>
			<Button
				size="icon"
				variant="ghost"
				class="backdrop-blur-none"
				aria-label="Open settings"
				onclick={() => settingsOverlayState.show()}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.75"
					stroke="currentColor"
					class="size-4"
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
			<Button
				size="sm"
				disabled={isSaving || !hasUnsavedChanges}
				onclick={async () => {
					save();
				}}
			>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		</div>
	</div>
{/if}
