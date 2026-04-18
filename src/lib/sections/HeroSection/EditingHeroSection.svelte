<script lang="ts">
	import {
		Badge,
		Button,
		Checkbox,
		cn,
		Input,
		Label,
		Popover,
		ToggleGroup,
		ToggleGroupItem
	} from '@foxui/core';
	import PlainTextEditor from '$lib/components/PlainTextEditor.svelte';
	import { CardDefinitionsByType } from '$lib/cards';
	import type { EditingSectionContentProps } from '../types';
	import {
		DEFAULT_DECORATION_SLOTS,
		getSlotAssignments,
		getSlotItem,
		heroAlignClasses,
		heroVerticalAlignClasses
	} from './shared';
	import Decoration from './Decoration.svelte';
	import SectionChrome from '../SectionChrome.svelte';

	const heroIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 10h10"/><path d="M7 14h6"/></svg>`;

	let {
		section,
		items = $bindable(),
		isMobile,
		isActive,
		onlayoutchange,
		onrequestaddcard,
		onactivate,
		onrefchange
	}: EditingSectionContentProps = $props();

	let d = $derived(section.sectionData);
	let align = $derived((d.textAlign as string) ?? 'center');
	let vAlign = $derived((d.verticalAlign as string) ?? 'center');
	let assignments = $derived(getSlotAssignments(d));
	let sectionItems = $derived(items.filter((i) => i.sectionId === section.id));

	let containerRef: HTMLDivElement | undefined = $state();
	let hovered = $state(false);
	let settingsOpen = $state(false);

	$effect(() => {
		onrefchange(containerRef);
		return () => onrefchange(undefined);
	});

	$effect(() => {
		const el = containerRef;
		if (!el) return;

		const enter = () => (hovered = true);
		const leave = () => (hovered = false);
		const down = () => onactivate();

		el.addEventListener('pointerenter', enter);
		el.addEventListener('pointerleave', leave);
		el.addEventListener('pointerdown', down);

		return () => {
			el.removeEventListener('pointerenter', enter);
			el.removeEventListener('pointerleave', leave);
			el.removeEventListener('pointerdown', down);
		};
	});

	function update(key: string, value: any) {
		section.sectionData = { ...d, [key]: value };
		onlayoutchange();
	}

	function openSlotPicker(slotId: string) {
		onrequestaddcard({ slotId });
	}

	$effect(() => {
		const itemIds = new Set(sectionItems.map((i) => i.id));
		const staleSlots = Object.entries(assignments).filter(([, itemId]) => !itemIds.has(itemId));
		if (staleSlots.length > 0) {
			const next = { ...assignments };
			for (const [slotId] of staleSlots) delete next[slotId];
			section.sectionData = { ...d, slotAssignments: next };
			return;
		}

		const assignedItemIds = new Set(Object.values(assignments));
		const unassigned = sectionItems.filter((i) => !assignedItemIds.has(i.id));
		if (unassigned.length === 0) return;

		const newAssignments = { ...assignments };
		for (const item of unassigned) {
			const targetSlotId = item.cardData?._slotId;
			if (targetSlotId) delete item.cardData._slotId;

			if (targetSlotId && !newAssignments[targetSlotId]) {
				newAssignments[targetSlotId] = item.id;
			} else {
				const freeSlot = DEFAULT_DECORATION_SLOTS.find((s) => !newAssignments[s.id]);
				if (freeSlot) {
					newAssignments[freeSlot.id] = item.id;
				}
			}
		}
		section.sectionData = { ...d, slotAssignments: newAssignments };
	});

	function clearSlot(slotId: string) {
		const itemId = assignments[slotId];
		if (itemId) {
			items = items.filter((i) => i.id !== itemId);
		}
		const next = { ...assignments };
		delete next[slotId];
		update('slotAssignments', next);
	}

	const toggleClasses = 'size-8 min-w-8 [&_svg]:size-3 cursor-pointer';

	function confirmUrl() {
		let href = (d.buttonHref as string)?.trim() || '';
		if (href && !/^https?:\/\//i.test(href) && !href.startsWith('#')) {
			href = 'https://' + href;
		}
		update('buttonHref', href);
	}

	let filledSlots = $derived(
		DEFAULT_DECORATION_SLOTS.filter((slot) => assignments[slot.id])
			.map((slot) => ({
				slot,
				item: getSlotItem(slot, assignments, sectionItems)
			}))
			.filter((s) => s.item)
	);
</script>

<div
	bind:this={containerRef}
	class="@container/grid pointer-events-auto relative col-span-3 flex min-h-[calc(100dvh-4rem)] flex-col overflow-visible px-2 py-10 lg:px-8"
>
	<SectionChrome {isActive} {hovered} name={section.name || 'Hero'} icon={heroIcon} />

	{#if hovered || isActive}
		<div class="pointer-events-auto absolute -top-3 right-4 z-40">
			<Popover bind:open={settingsOpen}>
				{#snippet child({ props })}
					<button
						{...props}
						class="bg-base-100/80 dark:bg-base-900/80 hover:bg-base-200/80 dark:hover:bg-base-800/80 cursor-pointer rounded-full p-1 px-2 text-xs backdrop-blur-sm"
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
				{/snippet}
				<div class="flex w-72 flex-col gap-3">
					<div class="flex flex-col gap-2">
						<Label class="text-sm">Show</Label>
						<div class="flex items-center space-x-2">
							<Checkbox
								bind:checked={() => d.showBadge !== false, (val) => update('showBadge', val)}
								id="hero-show-badge"
								variant="secondary"
							/>
							<Label for="hero-show-badge" class="text-sm leading-none">Badge</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox
								bind:checked={() => d.showSubtitle !== false, (val) => update('showSubtitle', val)}
								id="hero-show-subtitle"
								variant="secondary"
							/>
							<Label for="hero-show-subtitle" class="text-sm leading-none">Subtitle</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox
								bind:checked={() => d.showButton !== false, (val) => update('showButton', val)}
								id="hero-show-button"
								variant="secondary"
							/>
							<Label for="hero-show-button" class="text-sm leading-none">Button</Label>
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<Label for="hero-button-href" class="text-sm">Button link</Label>
						<Input
							id="hero-button-href"
							value={d.buttonHref ?? ''}
							oninput={(e) => update('buttonHref', (e.target as HTMLInputElement).value)}
							placeholder="example.com"
							class="text-sm"
							onkeydown={(event) => {
								if (event.code === 'Enter') {
									event.preventDefault();
									confirmUrl();
								}
							}}
						/>
					</div>

					<div class="flex flex-col gap-1">
						<Label class="text-sm">Alignment</Label>
						<ToggleGroup
							type="single"
							bind:value={
								() => d.textAlign ?? 'center',
								(value) => {
									if (value) update('textAlign', value);
								}
							}
						>
							<ToggleGroupItem size="sm" value="left" class={toggleClasses}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M21 5H3" /><path d="M15 12H3" /><path d="M17 19H3" /></svg
								>
							</ToggleGroupItem>
							<ToggleGroupItem size="sm" value="center" class={toggleClasses}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M21 5H3" /><path d="M17 12H7" /><path d="M19 19H5" /></svg
								>
							</ToggleGroupItem>
							<ToggleGroupItem size="sm" value="right" class={toggleClasses}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M21 5H3" /><path d="M21 12H9" /><path d="M21 19H7" /></svg
								>
							</ToggleGroupItem>
						</ToggleGroup>
					</div>

					{#if filledSlots.length > 0}
						<div class="border-base-200 dark:border-base-800 flex flex-col gap-2 border-t pt-3">
							<Label class="text-sm">Slot cards</Label>
							{#each filledSlots as { slot, item: slotItem } (slot.id)}
								<div
									class="border-base-200 dark:border-base-800 flex items-center gap-2 rounded-xl border p-2"
								>
									<span class="text-base-500 text-xs">
										{slot.side === 'left' ? 'L' : 'R'}{DEFAULT_DECORATION_SLOTS.filter(
											(s) => s.side === slot.side
										).indexOf(slot) + 1}
									</span>
									<span class="flex-1 truncate text-xs">
										{CardDefinitionsByType[slotItem?.cardType ?? '']?.name ?? slotItem?.cardType}
									</span>
									<Button
										size="sm"
										variant="ghost"
										onclick={() => clearSlot(slot.id)}
										class="text-xs text-rose-500"
									>
										Remove
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</Popover>
		</div>
	{/if}

	<div class="group/hero relative flex flex-1 flex-col">
		{#each DEFAULT_DECORATION_SLOTS as slot (slot.id)}
			{@const slotItem = getSlotItem(slot, assignments, sectionItems)}
			<Decoration
				{slot}
				item={slotItem}
				isEditing
				ondelete={() => clearSlot(slot.id)}
				onclick={() => openSlotPicker(slot.id)}
			/>
		{/each}

		<div
			class={cn(
				'pointer-events-none relative z-10 flex w-full flex-1 flex-col gap-4 px-8 py-10 sm:px-12',
				heroAlignClasses[align],
				heroVerticalAlignClasses[vAlign]
			)}
		>
			{#if d.showBadge !== false}
				<Badge size="md" variant="primary">
					<PlainTextEditor
						contentDict={d}
						key="badge"
						placeholder="Badge"
						class="min-w-[2rem]"
						onupdate={(text) => update('badge', text)}
					/>
				</Badge>
			{/if}

			<PlainTextEditor
				contentDict={d}
				key="title"
				placeholder="My cool website"
				class="text-base-950 dark:text-base-50 accent:text-accent-950 w-full text-4xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl"
				onupdate={(text) => update('title', text)}
			/>

			{#if d.showSubtitle !== false}
				<PlainTextEditor
					contentDict={d}
					key="subtitle"
					placeholder="Subtitle"
					class="text-base-600 dark:text-base-300 accent:text-accent-900/80 w-full max-w-2xl text-lg text-pretty sm:text-xl"
					onupdate={(text) => update('subtitle', text)}
				/>
			{/if}

			{#if d.showButton !== false}
				<div
					class={cn(
						'mt-2 flex w-full',
						align === 'center'
							? 'justify-center'
							: align === 'right'
								? 'justify-end'
								: 'justify-start'
					)}
				>
					<PlainTextEditor
						contentDict={d}
						key="buttonText"
						placeholder="Button text"
						class="text-base-950 dark:text-base-50 accent:text-base-950 bg-accent-400 dark:bg-accent-500 inline-flex min-h-[1.5em] min-w-[6rem] items-center justify-center rounded-2xl px-6 py-3 text-xl font-semibold"
						onupdate={(text) => update('buttonText', text)}
					/>
				</div>
			{/if}
		</div>
	</div>
</div>
