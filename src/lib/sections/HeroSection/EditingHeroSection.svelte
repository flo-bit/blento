<script lang="ts">
	import { Badge, cn } from '@foxui/core';
	import PlainTextEditor from '$lib/components/PlainTextEditor.svelte';
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
</script>

<div
	bind:this={containerRef}
	class="@container/grid pointer-events-auto relative col-span-3 flex min-h-[calc(100dvh-4rem)] flex-col overflow-visible px-2 py-10 lg:px-8"
>
	<SectionChrome
		sectionId={section.id}
		{isActive}
		{hovered}
		name={section.name || 'Hero'}
		icon={heroIcon}
	/>

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
