<script lang="ts">
	import { COLUMNS } from '$lib';
	import { CardDefinitionsByType, getColor } from '$lib/cards';
	import type { Item, SectionRecord, WebsiteData } from '$lib/types';
	import { SectionDefinitionsByType } from '$lib/sections';
	import { ColorSelect } from '@foxui/colors';
	import { dev } from '$app/environment';
	import LayoutPanel from './LayoutPanel.svelte';
	import SectionPanel from './SectionPanel.svelte';

	let {
		open,
		// Which level the sidebar is showing. With sections disabled it is always 'card'.
		level = 'card',
		sectionsEnabled = false,
		item,
		section,
		sections,
		items = $bindable([]),
		data = $bindable(),
		isMobile,
		canDeleteSection = false,
		onResize,
		onlayoutchange = () => {},
		onselectsection = () => {},
		onselectcard = () => {},
		onaddsection = () => {},
		ondeletesection = () => {},
		onmovesection = () => {},
		ongotolayout = () => {},
		ongotosection = () => {},
		onclose
	}: {
		open: boolean;
		level?: 'card' | 'section' | 'layout';
		sectionsEnabled?: boolean;
		item: Item | null;
		section?: SectionRecord | null;
		sections?: SectionRecord[];
		items?: Item[];
		data: WebsiteData;
		isMobile: boolean;
		canDeleteSection?: boolean;
		onResize: (w: number, h: number) => void;
		onlayoutchange?: () => void;
		onselectsection?: (id: string) => void;
		onselectcard?: (id: string) => void;
		onaddsection?: (type: string) => void;
		ondeletesection?: (id: string) => void;
		onmovesection?: (id: string, dir: -1 | 1) => void;
		ongotolayout?: () => void;
		ongotosection?: () => void;
		onclose: () => void;
	} = $props();

	const cardDef = $derived(item ? (CardDefinitionsByType[item.cardType] ?? null) : null);

	const sectionDef = $derived(section ? SectionDefinitionsByType[section.sectionType] : null);
	const sectionName = $derived(
		section ? section.name || sectionDef?.name || section.sectionType : ''
	);
	const cardName = $derived(item ? item.cardData?.label || cardDef?.name || item.cardType : '');

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

	const sizeOptions = [
		{ w: 2, h: 2, label: 'Small', preview: 'size-3' },
		{ w: 4, h: 2, label: 'Wide', preview: 'h-3 w-6' },
		{ w: 2, h: 4, label: 'Tall', preview: 'h-6 w-3' },
		{ w: 4, h: 4, label: 'Large', preview: 'size-6' }
	] as const;
	const availableSizes = $derived(sizeOptions.filter((s) => canSetSize(s.w, s.h)));

	function isCurrentSize(w: number, h: number) {
		if (!item) return false;
		const currentW = isMobile ? item.mobileW : item.w;
		const currentH = isMobile ? item.mobileH : item.h;
		const targetW = isMobile ? w * 2 : w;
		const targetH = isMobile ? h * 2 : h;
		return currentW === targetW && currentH === targetH;
	}

	type TabId = 'content' | 'design';
	const allTabs: { id: TabId; label: string }[] = [
		{ id: 'content', label: 'Content' },
		{ id: 'design', label: 'Design' }
	];
	const tabs = $derived(allTabs.filter((t) => t.id !== 'content' || cardDef?.settingsComponent));
	let activeTab: TabId = $state('content');
	let lastItemId: string | null = null;
	$effect(() => {
		// When the selected card changes, default to Content if available, else Design.
		const currentId = item?.id ?? null;
		if (currentId !== lastItemId) {
			lastItemId = currentId;
			activeTab = cardDef?.settingsComponent ? 'content' : 'design';
		}
	});
</script>

<aside
	class={[
		'bg-base-100 dark:bg-base-950 border-base-200 dark:border-base-800 fixed top-13 bottom-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r transition-transform duration-200',
		open ? 'translate-x-0' : '-translate-x-full'
	]}
>
	<div class="border-base-200 dark:border-base-800 border-b px-4 pt-3">
		<div class="flex items-center justify-between gap-2">
			{#if sectionsEnabled}
				<nav class="flex min-w-0 flex-1 items-center gap-0.5 text-sm">
					<button
						type="button"
						class={[
							'shrink-0 cursor-pointer rounded px-1 py-0.5',
							level === 'layout'
								? 'text-base-900 dark:text-base-100 font-semibold'
								: 'text-base-500 hover:text-base-700 dark:text-base-400 dark:hover:text-base-200'
						]}
						onclick={ongotolayout}
					>
						Layout
					</button>
					{#if section && (level === 'section' || level === 'card')}
						<span class="text-base-300 dark:text-base-600 shrink-0">›</span>
						<button
							type="button"
							class={[
								'min-w-0 cursor-pointer truncate rounded px-1 py-0.5',
								level === 'section'
									? 'text-base-900 dark:text-base-100 font-semibold'
									: 'text-base-500 hover:text-base-700 dark:text-base-400 dark:hover:text-base-200'
							]}
							onclick={ongotosection}
						>
							{sectionName}
						</button>
					{/if}
					{#if level === 'card' && item}
						<span class="text-base-300 dark:text-base-600 shrink-0">›</span>
						<span
							class="text-base-900 dark:text-base-100 min-w-0 truncate px-1 py-0.5 font-semibold"
						>
							{cardName}
						</span>
					{/if}
				</nav>
			{:else}
				<h2 class="text-base-900 dark:text-base-100 text-sm font-semibold">Card settings</h2>
			{/if}
			<button
				type="button"
				class="text-base-500 hover:text-base-700 dark:text-base-400 dark:hover:text-base-200 shrink-0 cursor-pointer rounded-lg p-1"
				onclick={onclose}
				aria-label="Close settings"
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
		{#if level === 'card' && tabs.length > 1}
			<nav class="-mb-px flex gap-1 pt-3">
				{#each tabs as tab (tab.id)}
					<button
						type="button"
						class={[
							'cursor-pointer rounded-t-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap',
							activeTab === tab.id
								? 'bg-base-200 dark:bg-base-800 text-base-900 dark:text-base-100'
								: 'text-base-500 dark:text-base-400 hover:text-base-700 dark:hover:text-base-300'
						]}
						onclick={() => (activeTab = tab.id)}
					>
						{tab.label}
					</button>
				{/each}
			</nav>
		{:else}
			<div class="pb-3"></div>
		{/if}
	</div>

	{#if sectionsEnabled && level === 'layout'}
		<LayoutPanel
			sections={sections ?? []}
			bind:data
			{items}
			selectedSectionId={section?.id ?? null}
			{onselectsection}
			{onaddsection}
			{onmovesection}
		/>
	{:else if sectionsEnabled && level === 'section' && section}
		<SectionPanel
			{section}
			bind:items
			canDelete={canDeleteSection}
			{onlayoutchange}
			{onclose}
			{onselectcard}
			ondelete={() => section && ondeletesection(section.id)}
		/>
	{:else if item && cardDef}
		<div class="flex flex-col gap-6 px-4 py-4">
			{#if activeTab === 'content' && cardDef.settingsComponent}
				<cardDef.settingsComponent {item} {onclose} />
			{:else if activeTab === 'design'}
				{#if cardDef.allowSetColor !== false}
					<section class="flex flex-col gap-3">
						<h3 class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">
							Background color
						</h3>
						<div class="grid grid-cols-2 gap-2">
							{#each colorModes as mode (mode)}
								<button
									type="button"
									class={[
										'group flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 transition-colors',
										colorMode === mode
											? 'border-accent-500 bg-accent-500/10'
											: 'border-base-200 dark:border-base-700 hover:bg-base-100 dark:hover:bg-base-800'
									]}
									onclick={() => setColorMode(mode)}
									aria-pressed={colorMode === mode}
								>
									<div class="flex h-8 items-center justify-center">
										<span
											class={[
												'block size-7 overflow-hidden rounded-full ring-1 transition-colors',
												colorMode === mode ? 'ring-accent-500' : 'ring-base-300 dark:ring-base-700'
											]}
											style={mode === 'transparent'
												? 'background-image: linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%), linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%); background-size: 8px 8px; background-position: 0 0, 4px 4px;'
												: undefined}
										>
											{#if mode === 'base'}
												<span class="bg-base-300 dark:bg-base-700 block size-full"></span>
											{:else if mode === 'accent'}
												<span class="bg-accent-500 block size-full"></span>
											{:else if mode === 'custom'}
												{@const swatchColor =
													colorMode === 'custom' ? currentColor : lastCustomColor}
												<span
													class="block size-full"
													style={`background-color: var(--color-${swatchColor}-500)`}
												></span>
											{/if}
										</span>
									</div>
									<span
										class={[
											'text-xs capitalize',
											colorMode === mode
												? 'text-accent-600 dark:text-accent-400 font-medium'
												: 'text-base-600 dark:text-base-400'
										]}
									>
										{mode}
									</span>
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

				{#if cardDef.canResize !== false && availableSizes.length > 1}
					<section class="flex flex-col gap-3">
						<h3 class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Size</h3>
						<div class="grid grid-cols-2 gap-2">
							{#each availableSizes as size (`${size.w}x${size.h}`)}
								{@const selected = isCurrentSize(size.w, size.h)}
								<button
									type="button"
									class={[
										'group flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 transition-colors',
										selected
											? 'border-accent-500 bg-accent-500/10'
											: 'border-base-200 dark:border-base-700 hover:bg-base-100 dark:hover:bg-base-800'
									]}
									onclick={() => setSize(size.w, size.h)}
									aria-pressed={selected}
									aria-label={size.label}
								>
									<div class="flex h-8 items-center justify-center">
										<div
											class={[
												'rounded-sm border-2 transition-colors',
												size.preview,
												selected
													? 'border-accent-500'
													: 'border-base-700 group-hover:border-base-900 dark:border-base-300 dark:group-hover:border-base-50'
											]}
										></div>
									</div>
									<span
										class={[
											'text-xs',
											selected
												? 'text-accent-600 dark:text-accent-400 font-medium'
												: 'text-base-600 dark:text-base-400'
										]}
									>
										{size.label}
									</span>
								</button>
							{/each}
						</div>
					</section>
				{/if}
			{/if}
		</div>
	{/if}

	{#if dev && item}
		<div
			class="border-base-200 dark:border-base-800 text-base-500 dark:text-base-400 mt-auto border-t px-4 py-2 font-mono text-xs"
		>
			<span class="opacity-60">type:</span>
			{item.cardType}
		</div>
	{/if}
</aside>
