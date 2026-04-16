<script lang="ts">
	import type { Item } from '$lib/types';
	import type { SettingsComponentProps } from '../../types';
	import { Button, Checkbox, Input, Label, ToggleGroup, ToggleGroupItem } from '@foxui/core';
	import { getDidContext } from '$lib/website/context';
	import { getImage } from '$lib/helper';
	import { getHeroDecorations, type HeroDecoration } from '.';

	let { item = $bindable<Item>(), onclose }: SettingsComponentProps = $props();

	function confirmUrl() {
		let href = item.cardData.buttonHref?.trim() || '';
		if (href && !/^https?:\/\//i.test(href) && !href.startsWith('#')) {
			href = 'https://' + href;
		}
		item.cardData.buttonHref = href;
		onclose();
	}

	const toggleClasses = 'size-8 min-w-8 [&_svg]:size-3 cursor-pointer';

	const did = getDidContext();
	let allSlots = $derived(getHeroDecorations(item.cardData));
	let filledSlots = $derived(allSlots.filter((d) => d.image));

	function clearSlot(id: string) {
		const stored = (item.cardData.decorations as HeroDecoration[]) ?? [];
		item.cardData.decorations = stored.filter((d) => d.id !== id);
	}

	function updateSlot(id: string, patch: Partial<HeroDecoration>) {
		const stored = (item.cardData.decorations as HeroDecoration[]) ?? [];
		const idx = stored.findIndex((d) => d.id === id);
		const next = [...stored];
		if (idx >= 0) {
			next[idx] = { ...next[idx], ...patch };
		} else {
			const slot = allSlots.find((s) => s.id === id);
			if (!slot) return;
			next.push({ ...slot, ...patch });
		}
		item.cardData.decorations = next;
	}
</script>

<div class="flex w-72 flex-col gap-3">
	<div class="flex flex-col gap-2">
		<Label class="text-sm">Show</Label>
		<div class="flex items-center space-x-2">
			<Checkbox
				bind:checked={
					() => item.cardData.showBadge !== false, (val) => (item.cardData.showBadge = val)
				}
				id="hero-show-badge"
				aria-labelledby="hero-show-badge-label"
				variant="secondary"
			/>
			<Label id="hero-show-badge-label" for="hero-show-badge" class="text-sm leading-none">
				Badge
			</Label>
		</div>
		<div class="flex items-center space-x-2">
			<Checkbox
				bind:checked={
					() => item.cardData.showSubtitle !== false, (val) => (item.cardData.showSubtitle = val)
				}
				id="hero-show-subtitle"
				aria-labelledby="hero-show-subtitle-label"
				variant="secondary"
			/>
			<Label id="hero-show-subtitle-label" for="hero-show-subtitle" class="text-sm leading-none">
				Subtitle
			</Label>
		</div>
		<div class="flex items-center space-x-2">
			<Checkbox
				bind:checked={
					() => item.cardData.showButton !== false, (val) => (item.cardData.showButton = val)
				}
				id="hero-show-button"
				aria-labelledby="hero-show-button-label"
				variant="secondary"
			/>
			<Label id="hero-show-button-label" for="hero-show-button" class="text-sm leading-none">
				Button
			</Label>
		</div>
	</div>

	<div class="flex flex-col gap-1">
		<Label for="hero-button-href" class="text-sm">Button link</Label>
		<Input
			id="hero-button-href"
			bind:value={item.cardData.buttonHref}
			placeholder="example.com"
			class="mt-2 text-sm"
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
				() => {
					return item.cardData.textAlign ?? 'center';
				},
				(value) => {
					if (!value) return;
					item.cardData.textAlign = value;
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
				>
					<path d="M21 5H3" /><path d="M15 12H3" /><path d="M17 19H3" />
				</svg>
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
				>
					<path d="M21 5H3" /><path d="M17 12H7" /><path d="M19 19H5" />
				</svg>
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
				>
					<path d="M21 5H3" /><path d="M21 12H9" /><path d="M21 19H7" />
				</svg>
			</ToggleGroupItem>
		</ToggleGroup>
	</div>

	<div class="flex flex-col gap-1">
		<Label class="text-sm">Vertical</Label>
		<ToggleGroup
			type="single"
			bind:value={
				() => {
					return item.cardData.verticalAlign ?? 'center';
				},
				(value) => {
					if (!value) return;
					item.cardData.verticalAlign = value;
				}
			}
		>
			<ToggleGroupItem size="sm" value="top" class={toggleClasses}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect width="6" height="16" x="4" y="6" rx="2" />
					<rect width="6" height="9" x="14" y="6" rx="2" />
					<path d="M22 2H2" />
				</svg>
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
				>
					<rect width="10" height="6" x="7" y="9" rx="2" />
					<path d="M22 20H2" />
					<path d="M22 4H2" />
				</svg>
			</ToggleGroupItem>
			<ToggleGroupItem size="sm" value="bottom" class={toggleClasses}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect width="14" height="6" x="5" y="12" rx="2" />
					<rect width="10" height="6" x="7" y="2" rx="2" />
					<path d="M2 22h20" />
				</svg>
			</ToggleGroupItem>
		</ToggleGroup>
	</div>

	<div class="border-base-200 dark:border-base-800 flex flex-col gap-2 border-t pt-3">
		<Label class="text-sm">Decorations</Label>

		{#if filledSlots.length === 0}
			<p class="text-base-500 dark:text-base-400 text-xs">
				Hover the hero card and click an empty slot to add a side image. Edit titles & subtitles
				here once filled.
			</p>
		{/if}

		{#each filledSlots as decoration (decoration.id)}
			<div
				class="border-base-200 dark:border-base-800 flex items-start gap-2 rounded-xl border p-2"
			>
				<img
					src={getImage(decoration as Record<string, any>, did, 'image')}
					alt=""
					class="size-12 shrink-0 rounded-lg object-cover"
				/>
				<div class="flex flex-1 flex-col gap-1">
					<Input
						placeholder="Title"
						value={decoration.title ?? ''}
						oninput={(e) =>
							updateSlot(decoration.id, { title: (e.target as HTMLInputElement).value })}
						class="text-xs"
					/>
					<Input
						placeholder="Subtitle"
						value={decoration.subtitle ?? ''}
						oninput={(e) =>
							updateSlot(decoration.id, { subtitle: (e.target as HTMLInputElement).value })}
						class="text-xs"
					/>
					<Button
						size="sm"
						variant="ghost"
						onclick={() => clearSlot(decoration.id)}
						class="self-start text-xs"
					>
						Remove
					</Button>
				</div>
			</div>
		{/each}
	</div>
</div>
