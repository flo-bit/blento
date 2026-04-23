<script lang="ts">
	import { COLUMNS } from '$lib';
	import { CardDefinitionsByType, getColor } from '$lib/cards';
	import type { Item } from '$lib/types';
	import { ColorSelect } from '@foxui/colors';

	let {
		open,
		item,
		isMobile,
		onResize,
		onclose
	}: {
		open: boolean;
		item: Item | null;
		isMobile: boolean;
		onResize: (w: number, h: number) => void;
		onclose: () => void;
	} = $props();

	const cardDef = $derived(item ? (CardDefinitionsByType[item.cardType] ?? null) : null);

	const specialColors = ['base', 'accent', 'transparent'] as const;
	const colorModes = ['base', 'accent', 'transparent', 'custom'] as const;
	type ColorMode = (typeof colorModes)[number];

	let lastCustomColor = $state('rose');

	const currentColor = $derived(item ? getColor(item) : 'base');
	const colorMode = $derived<ColorMode>(
		(specialColors as readonly string[]).includes(currentColor)
			? (currentColor as ColorMode)
			: 'custom'
	);

	function setColorMode(mode: ColorMode) {
		if (!item) return;
		if (mode === 'custom') {
			item.color = lastCustomColor;
			return;
		}
		if (colorMode === 'custom') {
			lastCustomColor = currentColor;
		}
		item.color = mode;
	}

	function pickCustomColor(label: string) {
		if (!item) return;
		item.color = label;
		lastCustomColor = label;
	}

	const minW = $derived(cardDef?.minW ?? 2);
	const minH = $derived(cardDef?.minH ?? 2);
	const maxW = $derived(cardDef?.maxW ?? COLUMNS);
	const maxH = $derived(cardDef?.maxH ?? (isMobile ? 12 : 6));

	function canSetSize(w: number, h: number) {
		if (!cardDef) return false;
		if (isMobile) {
			return w >= minW && w * 2 <= maxW && h >= minH && h * 2 <= maxH;
		}
		return w >= minW && w <= maxW && h >= minH && h <= maxH;
	}

	function setSize(w: number, h: number) {
		if (isMobile) {
			w *= 2;
			h *= 2;
		}
		onResize(w, h);
	}

	const allColorChoices = [
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

	const selectedCustomColor = $derived(
		colorMode === 'custom' ? allColorChoices.find((c) => c.label === currentColor) : undefined
	);
</script>

<aside
	class={[
		'bg-base-100 dark:bg-base-950 border-base-200 dark:border-base-800 fixed top-26 right-0 bottom-0 z-40 flex w-64 flex-col overflow-y-auto border-l transition-transform duration-200',
		open ? 'translate-x-0' : 'translate-x-full'
	]}
>
	<div
		class="border-base-200 dark:border-base-800 flex items-center justify-between border-b px-4 py-3"
	>
		<h2 class="text-base-900 dark:text-base-100 text-sm font-semibold">Card settings</h2>
		<button
			type="button"
			class="text-base-500 hover:text-base-700 dark:text-base-400 dark:hover:text-base-200 cursor-pointer rounded-lg p-1"
			onclick={onclose}
			aria-label="Close card settings"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="size-4"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	{#if item && cardDef}
		<div class="flex flex-col gap-6 px-4 py-4">
			{#if cardDef.allowSetColor !== false}
				<section class="flex flex-col gap-3">
					<h3 class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Color</h3>
					<div class="flex flex-wrap gap-1.5">
						{#each colorModes as mode (mode)}
							<button
								type="button"
								class={[
									'cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors',
									colorMode === mode
										? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
										: 'border-base-200 dark:border-base-700 text-base-700 dark:text-base-300 hover:bg-base-100 dark:hover:bg-base-800'
								]}
								onclick={() => setColorMode(mode)}
							>
								{mode}
							</button>
						{/each}
					</div>
					{#if colorMode === 'custom'}
						<ColorSelect
							selected={selectedCustomColor}
							colors={allColorChoices}
							onselected={(color) => {
								if (typeof color === 'string') return;
								pickCustomColor(color.label);
							}}
							class="w-full"
						/>
					{/if}
				</section>
			{/if}

			{#if cardDef.canResize !== false}
				<section class="flex flex-col gap-3">
					<h3 class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Size</h3>
					<div class="flex items-center gap-2">
						{#if canSetSize(2, 2)}
							<button
								type="button"
								onclick={() => setSize(2, 2)}
								class="border-base-200 dark:border-base-700 hover:bg-accent-500/10 flex cursor-pointer items-center justify-center rounded-lg border p-2.5"
								aria-label="Small square"
							>
								<div class="border-base-900 dark:border-base-50 size-3 rounded-sm border-2"></div>
							</button>
						{/if}
						{#if canSetSize(4, 2)}
							<button
								type="button"
								onclick={() => setSize(4, 2)}
								class="border-base-200 dark:border-base-700 hover:bg-accent-500/10 flex cursor-pointer items-center justify-center rounded-lg border p-2.5"
								aria-label="Wide"
							>
								<div class="border-base-900 dark:border-base-50 h-3 w-6 rounded-sm border-2"></div>
							</button>
						{/if}
						{#if canSetSize(2, 4)}
							<button
								type="button"
								onclick={() => setSize(2, 4)}
								class="border-base-200 dark:border-base-700 hover:bg-accent-500/10 flex cursor-pointer items-center justify-center rounded-lg border p-2.5"
								aria-label="Tall"
							>
								<div class="border-base-900 dark:border-base-50 h-6 w-3 rounded-sm border-2"></div>
							</button>
						{/if}
						{#if canSetSize(4, 4)}
							<button
								type="button"
								onclick={() => setSize(4, 4)}
								class="border-base-200 dark:border-base-700 hover:bg-accent-500/10 flex cursor-pointer items-center justify-center rounded-lg border p-2.5"
								aria-label="Large square"
							>
								<div class="border-base-900 dark:border-base-50 size-6 rounded-sm border-2"></div>
							</button>
						{/if}
					</div>
				</section>
			{/if}

			{#if cardDef.settingsComponent}
				<section class="flex flex-col gap-3">
					<h3 class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Options</h3>
					<cardDef.settingsComponent {item} {onclose} />
				</section>
			{/if}
		</div>
	{/if}
</aside>
