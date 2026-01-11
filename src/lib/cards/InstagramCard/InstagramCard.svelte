<script lang="ts">
	import type { ContentComponentProps } from '../types';

	let { item }: ContentComponentProps = $props();
</script>

<div class="flex h-full flex-col justify-between p-4">
	<div class="flex items-start gap-3">
		<div
			class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-6 text-white">
				<path
					fill="currentColor"
					d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
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
		href="https://instagram.com/{item.cardData.username}"
		class="absolute inset-0 h-full w-full"
		target="_blank"
		rel="noopener noreferrer"
	>
		<span class="sr-only">Visit Instagram profile</span>

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
