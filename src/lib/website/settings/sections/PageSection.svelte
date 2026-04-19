<script lang="ts">
	import type { WebsiteData } from '$lib/types';
	import { getHideProfileSection, getProfilePosition } from '$lib/helper';
	import SelectTheme from '$lib/components/select-theme/SelectTheme.svelte';
	import { Checkbox, Label } from '@foxui/core';

	let { data = $bindable() }: { data: WebsiteData } = $props();

	let hideProfile = $derived(getHideProfileSection(data));
	let profilePosition = $derived(getProfilePosition(data));

	function setProfilePosition(position: 'top' | 'side') {
		data.publication.preferences ??= {};
		data.publication.preferences.profilePosition = position;
		data = { ...data };
	}

	const positionOptions = [
		{ value: 'top' as const, label: 'Top', description: 'Profile appears at the top of the page' },
		{
			value: 'side' as const,
			label: 'Side',
			description: 'Profile appears on the left side (desktop only)'
		}
	];
</script>

<!-- Profile Section -->
<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Profile</h3>
<p class="text-base-500 dark:text-base-400 mt-1 text-sm">
	Show or hide the profile section on your page.
</p>

<div class="mt-4 flex items-center gap-2">
	<Checkbox
		id="show-profile"
		checked={!hideProfile}
		onCheckedChange={(checked) => {
			data.publication.preferences ??= {};
			data.publication.preferences.hideProfileSection = !checked;
			data = { ...data };
		}}
	/>
	<Label for="show-profile" class="text-sm leading-none font-medium">Show profile</Label>
</div>

{#if !hideProfile}
	<div class="mt-6">
		<h4 class="text-base-800 dark:text-base-200 text-sm font-semibold">Position</h4>
		<div class="mt-3 flex flex-col gap-2">
			{#each positionOptions as option (option.value)}
				{@const isSelected = profilePosition === option.value}
				<button
					type="button"
					class="border-base-200 dark:border-base-700 hover:border-base-300 dark:hover:border-base-600 cursor-pointer rounded-xl border-2 px-4 py-3 text-left transition-colors {isSelected
						? 'border-accent-500 bg-accent-50 dark:bg-accent-950/20'
						: 'bg-base-50 dark:bg-base-800/50'}"
					onclick={() => setProfilePosition(option.value)}
				>
					<span
						class="text-sm font-semibold {isSelected
							? 'text-accent-700 dark:text-accent-300'
							: 'text-base-900 dark:text-base-100'}"
					>
						{option.label}
					</span>
					<p
						class="mt-0.5 text-xs {isSelected
							? 'text-accent-600 dark:text-accent-400'
							: 'text-base-500 dark:text-base-400'}"
					>
						{option.description}
					</p>
				</button>
			{/each}
		</div>
	</div>
{/if}

<hr class="border-base-200 dark:border-base-700 my-8" />

<!-- Colors Section -->
<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Colors</h3>
<p class="text-base-500 dark:text-base-400 mt-1 text-sm">
	Choose the accent and base colors for your site.
</p>

<div class="mt-4">
	<SelectTheme
		accentColor={data.publication.preferences?.accentColor ?? 'pink'}
		baseColor={data.publication.preferences?.baseColor ?? 'stone'}
		onchanged={(accentColor, baseColor) => {
			data.publication.preferences ??= {};
			data.publication.preferences.accentColor = accentColor;
			data.publication.preferences.baseColor = baseColor;
			data = { ...data };
		}}
	/>
</div>
