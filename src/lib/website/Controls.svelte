<script lang="ts">
	import { SelectThemePopover } from '$lib/components/select-theme';
	import { getHideProfileSection, getProfilePosition } from '$lib/helper';
	import type { WebsiteData } from '$lib/types';
	import { Button } from '@foxui/core';
	import { getIsMobile } from './context';

	let { data = $bindable() }: { data: WebsiteData } = $props();

	let accentColor = $derived(data.publication?.preferences?.accentColor ?? 'pink');
	let baseColor = $derived(data.publication?.preferences?.baseColor ?? 'stone');

	function updateTheme(newAccent: string, newBase: string) {
		data.publication.preferences ??= {};
		data.publication.preferences.accentColor = newAccent;
		data.publication.preferences.baseColor = newBase;
		data = { ...data };
	}

	let profilePosition = $derived(getProfilePosition(data));

	function toggleProfilePosition() {
		data.publication.preferences ??= {};
		data.publication.preferences.profilePosition = profilePosition === 'side' ? 'top' : 'side';
		data = { ...data };
	}

	let isMobile = getIsMobile();
</script>

<div class={['fixed top-2 left-14 z-20 flex gap-2']}>
	<Button
		size="icon"
		onclick={() => {
			data.publication.preferences ??= {};
			data.publication.preferences.hideProfileSection =
				!data.publication.preferences?.hideProfileSection;
			data = { ...data };
		}}
		variant="ghost"
	>
		{#if !getHideProfileSection(data)}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-5!"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
				/>
			</svg>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-5!"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
				/>
			</svg>
		{/if}
	</Button>

	<!-- Position toggle button (desktop only) -->
	{#if !isMobile() && !getHideProfileSection(data)}
		<Button size="icon" type="button" onclick={toggleProfilePosition} variant="ghost">
			{#if profilePosition === 'side'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="size-5!"
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
					class="size-5!"
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

	<!-- Theme selection -->
	<SelectThemePopover
		{accentColor}
		{baseColor}
		onchanged={(newAccent, newBase) => updateTheme(newAccent, newBase)}
	/>
</div>
