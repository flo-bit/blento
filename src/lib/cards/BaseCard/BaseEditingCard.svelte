<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';
	import BaseCard from './BaseCard.svelte';
	import type { Item } from '$lib/types';
	import { Button, Popover } from '@foxui/core';
	import { getCanEdit, getIsMobile } from '$lib/helper';
	import { ColorSelect } from '@foxui/colors';
	import { CardDefinitionsByType, getColor } from '..';
	import { COLUMNS } from '$lib';

	let colorsChoices = [
		{ class: 'text-base-500', label: 'base' },
		{ class: 'text-accent-500', label: 'accent' },
		{ class: 'text-base-300 dark:text-base-700', label: 'transparent' },
		{ class: 'text-red-500', label: 'red' },
		{ class: 'text-orange-500', label: 'orange' },
		{ class: 'text-amber-500', label: 'amber' },
		{ class: 'text-yellow-500', label: 'yellow' },
		{ class: 'text-lime-500', label: 'lime' },
		{ class: 'text-green-500', label: 'green' },
		{ class: 'text-emerald-500', label: 'emerald' },
		{ class: 'text-teal-500', label: 'teal' },
		{ class: 'text-cyan-500', label: 'cyan' },
		{ class: 'text-sky-500', label: 'sky' },
		{ class: 'text-blue-500', label: 'blue' },
		{ class: 'text-indigo-500', label: 'indigo' },
		{ class: 'text-violet-500', label: 'violet' },
		{ class: 'text-purple-500', label: 'purple' },
		{ class: 'text-fuchsia-500', label: 'fuchsia' },
		{ class: 'text-pink-500', label: 'pink' },
		{ class: 'text-rose-500', label: 'rose' }
	];

	export type BaseEditingCardProps = {
		item: Item;
		ondelete: () => void;
		onsetsize: (newW: number, newH: number) => void;
		onshowsettings?: () => void;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		item = $bindable(),
		children,
		ref = $bindable(null),
		onsetsize,
		onshowsettings,
		ondelete,
		...rest
	}: BaseEditingCardProps = $props();

	let selectedColor = $derived(colorsChoices.find((c) => getColor(item) === c.label));

	let canEdit = getCanEdit();

	let colorPopoverOpen = $state(false);

	const cardDef = $derived(CardDefinitionsByType[item.cardType]);

	const minW = $derived(cardDef.minW ?? 0);
	const minH = $derived(cardDef.minH ?? 0);

	const maxW = $derived(cardDef.maxW ?? COLUMNS);
	const maxH = $derived(cardDef.maxH ?? COLUMNS);

	function canSetSize(w: number, h: number) {
		if (!cardDef) return false;

		return w >= minW && w <= maxW && h >= minH && h <= maxH;
	}
</script>

<BaseCard {item} {...rest} isEditing={true} bind:ref>
	{@render children?.()}

	{#snippet controls()}
		<!-- class="bg-base-100 border-base-200 dark:bg-base-800 dark:border-base-700 absolute -top-3 -left-3 hidden cursor-pointer items-center justify-center rounded-full border p-2 shadow-lg group-focus-within:inline-flex group-hover:inline-flex" -->
		{#if canEdit()}
			<Button
				size="icon"
				variant="rose"
				onclick={() => {
					ondelete();
				}}
				class="absolute -top-3 -left-3 hidden group-focus-within:inline-flex group-hover:inline-flex"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
					/>
				</svg>

				<span class="sr-only">Delete card</span>
			</Button>

			<div
				class={[
					'absolute -bottom-7 z-50 w-full items-center justify-center text-xs group-focus-within:inline-flex group-hover:inline-flex',
					colorPopoverOpen ? 'inline-flex' : 'hidden'
				]}
			>
				<div
					class="bg-base-100 border-base-200 dark:bg-base-800 dark:border-base-700 inline-flex items-center gap-0.5 rounded-2xl border p-1 px-2 shadow-lg"
				>
					<Popover bind:open={colorPopoverOpen}>
						{#snippet child({ props })}
							<button
								{...props}
								class={[
									'm-2 size-4 cursor-pointer rounded-full',
									!item.color || item.color === 'base' || item.color === 'transparent'
										? 'text-base-800 dark:text-base-200'
										: 'text-accent-500'
								]}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="size-4"
								>
									<path
										fill-rule="evenodd"
										d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 0 0-3.471 2.987 10.04 10.04 0 0 1 4.815 4.815 18.748 18.748 0 0 0 2.987-3.472l3.386-5.079A1.902 1.902 0 0 0 20.599 1.5Zm-8.3 14.025a18.76 18.76 0 0 0 1.896-1.207 8.026 8.026 0 0 0-4.513-4.513A18.75 18.75 0 0 0 8.475 11.7l-.278.5a5.26 5.26 0 0 1 3.601 3.602l.502-.278ZM6.75 13.5A3.75 3.75 0 0 0 3 17.25a1.5 1.5 0 0 1-1.601 1.497.75.75 0 0 0-.7 1.123 5.25 5.25 0 0 0 9.8-2.62 3.75 3.75 0 0 0-3.75-3.75Z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						{/snippet}
						<ColorSelect
							selected={selectedColor}
							colors={colorsChoices}
							onselected={(color, previous) => {
								if (typeof previous === 'string' || typeof color === 'string') {
									return;
								}

								item.color = color.label;
							}}
							class="w-64"
						/>
					</Popover>

					{#if canSetSize(2, 2)}
						<button
							onclick={() => {
								onsetsize?.(2, 2);
							}}
							class="hover:bg-accent-500/10 cursor-pointer rounded-xl p-2"
						>
							<div class="border-base-900 dark:border-base-50 size-3 rounded-sm border-2"></div>

							<span class="sr-only">set size to 1x1</span>
						</button>
					{/if}

					{#if canSetSize(4, 2)}
						<button
							onclick={() => {
								onsetsize?.(4, 2);
							}}
							class="hover:bg-accent-500/10 cursor-pointer rounded-xl p-2"
						>
							<div class="border-base-900 dark:border-base-50 h-3 w-5 rounded-sm border-2"></div>
							<span class="sr-only">set size to 2x1</span>
						</button>
					{/if}
					{#if canSetSize(2, 4)}
						<button
							onclick={() => {
								onsetsize?.(2, 4);
							}}
							class="hover:bg-accent-500/10 cursor-pointer rounded-xl p-2"
						>
							<div class="border-base-900 dark:border-base-50 h-5 w-3 rounded-sm border-2"></div>

							<span class="sr-only">set size to 1x2</span>
						</button>
					{/if}
					{#if canSetSize(4, 4)}
						<button
							onclick={() => {
								onsetsize?.(4, 4);
							}}
							class="hover:bg-accent-500/10 cursor-pointer rounded-xl p-2"
						>
							<div class="border-base-900 dark:border-base-50 h-5 w-5 rounded-sm border-2"></div>

							<span class="sr-only">set size to 2x2</span>
						</button>
					{/if}

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
		{/if}
	{/snippet}
</BaseCard>
