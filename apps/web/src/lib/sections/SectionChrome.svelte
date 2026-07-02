<script lang="ts">
	import { isSectionsEditingEnabled } from './feature-flag';
	import { getDidContext, getOpenSectionSettings } from '$lib/website/data/context';

	let {
		sectionId,
		isActive,
		hovered,
		name,
		icon
	}: {
		sectionId: string;
		isActive: boolean;
		hovered: boolean;
		name: string;
		icon?: string;
	} = $props();

	const did = getDidContext();
	const openSettings = getOpenSectionSettings();
	const enabled = $derived(isSectionsEditingEnabled(did));
</script>

{#if enabled && (hovered || isActive)}
	<div
		class="rounded-card pointer-events-none absolute inset-0 z-30 border-2 border-dashed transition-colors duration-150 {isActive
			? 'border-accent-500/50'
			: 'border-base-400/30 dark:border-base-500/30'}"
	>
		<div
			class="bg-base-100/80 dark:bg-base-900/80 absolute -bottom-3 left-4 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm {isActive
				? 'text-accent-600 dark:text-accent-400'
				: 'text-base-500 dark:text-base-400'}"
		>
			{#if icon}
				<span class="[&_svg]:size-3">{@html icon}</span>
			{/if}
			{name}
		</div>

		<button
			type="button"
			class="bg-base-100/80 dark:bg-base-900/80 hover:bg-base-200/80 dark:hover:bg-base-800/80 text-base-500 dark:text-base-400 hover:text-base-800 dark:hover:text-base-200 pointer-events-auto absolute -top-3 right-4 flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs backdrop-blur-sm"
			aria-label="Section settings"
			onclick={(e) => {
				e.stopPropagation();
				openSettings?.(sectionId);
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
				class="size-3.5"
			>
				<path
					d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
				/>
				<circle cx="12" cy="12" r="3" />
			</svg>
		</button>
	</div>
{/if}
