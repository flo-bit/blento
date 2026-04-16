<script lang="ts">
	import { Badge, cn } from '@foxui/core';
	import PlainTextEditor from '$lib/components/PlainTextEditor.svelte';
	import type { ContentComponentProps } from '../../types';
	import {
		getHeroDecorations,
		heroAlignClasses,
		heroVerticalAlignClasses,
		type HeroDecoration
	} from '.';
	import Decoration from './Decoration.svelte';

	let { item = $bindable() }: ContentComponentProps = $props();

	let align = $derived((item.cardData.textAlign as string) ?? 'center');
	let vAlign = $derived((item.cardData.verticalAlign as string) ?? 'center');
	let decorations = $derived(getHeroDecorations(item.cardData));

	let fileInput: HTMLInputElement | undefined = $state();
	let pendingSlotId: string | null = $state(null);

	function openImagePicker(slotId: string) {
		pendingSlotId = slotId;
		fileInput?.click();
	}

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		const slotId = pendingSlotId;
		input.value = '';
		pendingSlotId = null;
		if (!file || !slotId) return;

		const stored = (item.cardData.decorations as HeroDecoration[]) ?? [];
		const objectUrl = URL.createObjectURL(file);
		const existingIdx = stored.findIndex((d) => d.id === slotId);
		const next = [...stored];
		const patch = { image: { blob: file, objectUrl } };
		if (existingIdx >= 0) {
			next[existingIdx] = { ...next[existingIdx], ...patch };
		} else {
			const slotDefaults = decorations.find((d) => d.id === slotId);
			if (!slotDefaults) return;
			next.push({ ...slotDefaults, ...patch });
		}
		item.cardData.decorations = next;
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept="image/*"
	class="hidden"
	onchange={handleFileChange}
/>

<div class="group/hero relative h-full w-full">
	{#each decorations as decoration (decoration.id)}
		<Decoration {decoration} isEditing onclick={() => openImagePicker(decoration.id)} />
	{/each}

	<div
		class={cn(
			'pointer-events-none relative z-10 flex h-full w-full flex-col gap-4 px-8 py-10 sm:px-12',
			heroAlignClasses[align],
			heroVerticalAlignClasses[vAlign]
		)}
	>
		{#if item.cardData.showBadge !== false}
			<Badge size="md" variant="primary">
				<PlainTextEditor
					bind:contentDict={item.cardData}
					key="badge"
					placeholder="Badge"
					class="min-w-[2rem]"
				/>
			</Badge>
		{/if}

		<PlainTextEditor
			bind:contentDict={item.cardData}
			key="title"
			placeholder="My cool website"
			class="text-base-950 dark:text-base-50 accent:text-accent-950 w-full text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl"
		/>

		{#if item.cardData.showSubtitle !== false}
			<PlainTextEditor
				bind:contentDict={item.cardData}
				key="subtitle"
				placeholder="Subtitle"
				class="text-base-600 dark:text-base-300 accent:text-accent-900/80 w-full max-w-2xl text-lg text-pretty sm:text-xl"
			/>
		{/if}

		{#if item.cardData.showButton !== false}
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
					bind:contentDict={item.cardData}
					key="buttonText"
					placeholder="Button text"
					class="text-base-950 dark:text-base-50 accent:text-base-950 bg-accent-400 dark:bg-accent-500 inline-flex min-h-[1.5em] min-w-[6rem] items-center justify-center rounded-2xl px-6 py-3 text-xl font-semibold"
				/>
			</div>
		{/if}
	</div>
</div>
