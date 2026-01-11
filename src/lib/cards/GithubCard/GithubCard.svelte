<script lang="ts">
	import type { ContentComponentProps } from '../types';

	let { item }: ContentComponentProps = $props();
</script>

<div class="flex h-full flex-col justify-between p-4">
	<div class="flex items-start gap-3">
		<div
			class="bg-base-900 dark:bg-base-50 flex size-10 shrink-0 items-center justify-center rounded-xl"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="text-base-50 dark:text-base-900 size-6">
				<path
					fill="currentColor"
					d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
				/>
			</svg>
		</div>
		<div class="min-w-0 flex-1">
			<div class="text-base-900 dark:text-base-50 truncate text-lg font-semibold">
				{item.cardData.displayName || item.cardData.username}
			</div>
			<div class="text-accent-600 dark:text-accent-400 truncate text-sm font-medium">
				@{item.cardData.username}
			</div>
		</div>
	</div>

	{#if item.cardData.bio}
		<p class="text-base-600 dark:text-base-400 mt-3 line-clamp-3 text-sm">
			{item.cardData.bio}
		</p>
	{/if}

	<a
		href="https://github.com/{item.cardData.username}"
		class="absolute inset-0 h-full w-full"
		target="_blank"
		rel="noopener noreferrer"
	>
		<span class="sr-only">Visit GitHub profile</span>

		<div
			class="bg-base-800/30 border-base-900/30 absolute top-2 right-2 rounded-full border p-1 text-white opacity-50 backdrop-blur-lg group-focus-within:opacity-100 group-hover:opacity-100"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2.5"
				stroke="currentColor"
				class="size-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
				/>
			</svg>
		</div>
	</a>
</div>
