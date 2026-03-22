<script lang="ts">
	import type { SettingsComponentProps } from '../../types';

	let { item = $bindable() }: SettingsComponentProps = $props();

	let mode: 'emoji' | 'statusphere' = $derived(item.cardData.mode ?? 'emoji');
</script>

<div class="flex gap-2">
	<button
		class="rounded-full px-3 py-1 text-sm font-medium transition-colors {mode === 'emoji'
			? 'bg-accent-500 text-white'
			: 'bg-base-200 dark:bg-base-700 text-base-700 dark:text-base-300'}"
		onclick={() => (item.cardData.mode = 'emoji')}
	>
		Emoji
	</button>
	<button
		class="rounded-full px-3 py-1 text-sm font-medium transition-colors {mode === 'statusphere'
			? 'bg-accent-500 text-white'
			: 'bg-base-200 dark:bg-base-700 text-base-700 dark:text-base-300'}"
		onclick={() => (item.cardData.mode = 'statusphere')}
	>
		Statusphere
	</button>
</div>
