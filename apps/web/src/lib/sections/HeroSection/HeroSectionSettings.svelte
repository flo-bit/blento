<script lang="ts">
	import { Button, Checkbox, Input, Label, ToggleGroup, ToggleGroupItem } from '@foxui/core';
	import { CardDefinitionsByType } from '$lib/cards';
	import type { SectionSettingsProps } from '../types';
	import { DEFAULT_DECORATION_SLOTS, getSlotAssignments, getSlotItem } from './shared';

	let { section, items = $bindable(), onlayoutchange }: SectionSettingsProps = $props();

	let d = $derived(section.sectionData);
	let assignments = $derived(getSlotAssignments(d));
	let sectionItems = $derived(items.filter((i) => i.sectionId === section.id));

	function update(key: string, value: any) {
		section.sectionData = { ...d, [key]: value };
		onlayoutchange();
	}

	function confirmUrl() {
		let href = (d.buttonHref as string)?.trim() || '';
		if (href && !/^https?:\/\//i.test(href) && !href.startsWith('#')) {
			href = 'https://' + href;
		}
		update('buttonHref', href);
	}

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

	let filledSlots = $derived(
		DEFAULT_DECORATION_SLOTS.filter((slot) => assignments[slot.id])
			.map((slot) => ({ slot, item: getSlotItem(slot, assignments, sectionItems) }))
			.filter((s) => s.item)
	);
</script>

<section class="flex flex-col gap-3">
	<h3 class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Show</h3>
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
</section>

<section class="flex flex-col gap-1">
	<Label
		for="hero-button-href"
		class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Button link</Label
	>
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
</section>

<section class="flex flex-col gap-2">
	<Label class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Alignment</Label>
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
				stroke-linejoin="round"><path d="M21 5H3" /><path d="M15 12H3" /><path d="M17 19H3" /></svg
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
				stroke-linejoin="round"><path d="M21 5H3" /><path d="M17 12H7" /><path d="M19 19H5" /></svg
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
				stroke-linejoin="round"><path d="M21 5H3" /><path d="M21 12H9" /><path d="M21 19H7" /></svg
			>
		</ToggleGroupItem>
	</ToggleGroup>
</section>

{#if filledSlots.length > 0}
	<section class="border-base-200 dark:border-base-800 flex flex-col gap-2 border-t pt-3">
		<Label class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase"
			>Slot cards</Label
		>
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
	</section>
{/if}
