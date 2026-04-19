<script lang="ts" module>
	export const settingsOverlayState = $state({
		visible: false,
		activeSection: 'page' as string,
		show: () => (settingsOverlayState.visible = true),
		hide: () => (settingsOverlayState.visible = false)
	});
</script>

<script lang="ts">
	import type { WebsiteData } from '$lib/types';
	import PageSection from './sections/PageSection.svelte';
	import LayoutSection from './sections/LayoutSection.svelte';
	import CustomDomainSection from './sections/CustomDomainSection.svelte';
	import AccountSection from './sections/AccountSection.svelte';

	let { data = $bindable(), publicationUrl }: { data: WebsiteData; publicationUrl?: string } =
		$props();

	$effect(() => {
		if (settingsOverlayState.visible) {
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = '';
			};
		}
	});

	const tabs = [
		{ id: 'page', label: 'Page' },
		{ id: 'layout', label: 'Layout' },
		{ id: 'domain', label: 'Custom Domain' },
		{ id: 'account', label: 'Account' }
	] as const;
</script>

{#if settingsOverlayState.visible}
	<div class="bg-base-50 dark:bg-base-950 fixed inset-0 z-[100] flex flex-col overflow-hidden">
		<!-- Header with tabs and close button -->
		<div class="border-base-200 dark:border-base-800 border-b px-6 pt-4">
			<div class="flex items-center justify-between">
				<h2 class="text-base-900 dark:text-base-100 text-lg font-semibold">Settings</h2>
				<!-- Close button -->
				<button
					type="button"
					class="text-base-500 hover:text-base-700 dark:text-base-400 dark:hover:text-base-200 cursor-pointer rounded-lg p-1.5"
					onclick={() => settingsOverlayState.hide()}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
					<span class="sr-only">Close settings</span>
				</button>
			</div>
			<nav class="-mb-px flex gap-1 overflow-x-auto pt-3">
				{#each tabs as tab (tab.id)}
					<button
						type="button"
						class="cursor-pointer rounded-t-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap {settingsOverlayState.activeSection ===
						tab.id
							? 'bg-base-200 dark:bg-base-800 text-base-900 dark:text-base-100'
							: 'text-base-500 dark:text-base-400 hover:text-base-700 dark:hover:text-base-300'}"
						onclick={() => (settingsOverlayState.activeSection = tab.id)}
					>
						{tab.label}
					</button>
				{/each}
			</nav>
		</div>

		<!-- Content area -->
		<div class="flex-1 overflow-y-auto px-6 py-8">
			<div class="mx-auto max-w-xl">
				{#if settingsOverlayState.activeSection === 'page'}
					<PageSection bind:data />
				{:else if settingsOverlayState.activeSection === 'layout'}
					<LayoutSection bind:data />
				{:else if settingsOverlayState.activeSection === 'domain'}
					<CustomDomainSection {publicationUrl} />
				{:else if settingsOverlayState.activeSection === 'account'}
					<AccountSection />
				{/if}
			</div>
		</div>
	</div>
{/if}
