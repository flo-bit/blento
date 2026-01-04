<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';
	import Card from './BaseCard.svelte';
	import type { Item } from '$lib/types';

	export type BaseEditingCardProps = {
		item: Item;
		ondelete: () => void;
		onsetsize: (newW: number, newH: number) => void;
		onshowsettings?: () => void;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		item,
		children,
		ref = $bindable(null),
		onsetsize,
		onshowsettings,
		ondelete,
		...rest
	}: BaseEditingCardProps = $props();
</script>

<Card {item} {...rest} isEditing={true} bind:ref>
	{@render children?.()}

	{#snippet controls()}
		<button
			onclick={() => {
				ondelete();
			}}
			class="bg-base-100 border-base-200 dark:bg-base-800 dark:border-base-700 absolute -top-3 -left-3 hidden cursor-pointer items-center justify-center rounded-full border p-2 shadow-lg group-focus-within:inline-flex group-hover:inline-flex"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-4"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
			</svg>
			<span class="sr-only">Delete card</span>
		</button>

		<div
			class="absolute -bottom-7 z-50 hidden w-full items-center justify-center text-xs group-focus-within:inline-flex group-hover:inline-flex"
		>
			<div
				class="bg-base-100 border-base-200 dark:bg-base-800 dark:border-base-700 inline-flex gap-0.5 rounded-2xl border p-1 px-2 shadow-lg"
			>
				<button
					onclick={() => {
						onsetsize?.(1, 1);
					}}
					class="hover:bg-accent-500/10 cursor-pointer rounded-xl p-2"
				>
					<div class="border-base-900 dark:border-base-50 size-3 rounded-sm border-2"></div>

					<span class="sr-only">set size to 1x1</span>
				</button>

				<button
					onclick={() => {
						onsetsize?.(2, 1);
					}}
					class="hover:bg-accent-500/10 cursor-pointer rounded-xl p-2"
				>
					<div class="border-base-900 dark:border-base-50 h-3 w-5 rounded-sm border-2"></div>
					<span class="sr-only">set size to 2x1</span>
				</button>
				<button
					onclick={() => {
						onsetsize?.(1, 2);
					}}
					class="hover:bg-accent-500/10 cursor-pointer rounded-xl p-2"
				>
					<div class="border-base-900 dark:border-base-50 h-5 w-3 rounded-sm border-2"></div>

					<span class="sr-only">set size to 1x2</span>
				</button>
				<button
					onclick={() => {
						onsetsize?.(2, 2);
					}}
					class="hover:bg-accent-500/10 cursor-pointer rounded-xl p-2"
				>
					<div class="border-base-900 dark:border-base-50 h-5 w-5 rounded-sm border-2"></div>

					<span class="sr-only">set size to 2x2</span>
				</button>

				{#if onshowsettings}
					<button
						onclick={() => {
							onshowsettings();
						}}
						class="hover:bg-accent-500/10 cursor-pointer rounded-xl p-2"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="size-5"
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

						<span class="sr-only">open card settings</span>
					</button>
				{/if}
			</div>
		</div>
	{/snippet}
</Card>
