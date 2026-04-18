<script lang="ts">
	import { SECTIONS_EDITING_ENABLED } from './feature-flag';

	let {
		isActive,
		hovered,
		name,
		icon
	}: {
		isActive: boolean;
		hovered: boolean;
		name: string;
		icon?: string;
	} = $props();
</script>

{#if SECTIONS_EDITING_ENABLED && (hovered || isActive)}
	<div
		class="pointer-events-none absolute inset-0 z-30 rounded-3xl border-2 border-dashed transition-colors duration-150 {isActive
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
	</div>
{/if}
