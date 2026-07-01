<script lang="ts">
	import { compressImage, getImage } from '$lib/helpers/images';
	import { getDidContext } from '$lib/website/data/context';
	import { Button } from '@foxui/core';

	let {
		dict = $bindable(),
		key = 'image',
		maxSize,
		layout = 'tile',
		removable = false,
		aspect = 'aspect-video',
		rounded = 'rounded-xl',
		thumbClass = 'size-14',
		emptyLabel = 'Add image',
		changeLabel = 'Change image'
	}: {
		dict: Record<string, any>;
		key?: string;
		maxSize?: number;
		layout?: 'tile' | 'button' | 'compact';
		removable?: boolean;
		aspect?: string;
		rounded?: string;
		thumbClass?: string;
		emptyLabel?: string;
		changeLabel?: string;
	} = $props();

	const did = getDidContext();
	let inputRef: HTMLInputElement;
	let isBusy = $state(false);

	const src = $derived(getImage(dict, did, key));

	async function handleFile(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		isBusy = true;
		try {
			const blob = await compressImage(file, maxSize);
			dict[key] = { blob, objectUrl: URL.createObjectURL(blob) };
		} catch (error) {
			console.error('Failed to process image:', error);
		} finally {
			isBusy = false;
		}
	}

	function pick() {
		inputRef?.click();
	}

	function remove() {
		dict[key] = '';
	}
</script>

{#snippet placeholderIcon(size: string)}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
		class={size}
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
		/>
	</svg>
{/snippet}

<input type="file" accept="image/*" class="hidden" bind:this={inputRef} onchange={handleFile} />

{#if layout === 'button'}
	<Button variant="secondary" class="w-full justify-start" disabled={isBusy} onclick={pick}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="mr-2 size-4"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
			/>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
			/>
		</svg>
		{isBusy ? 'Processing…' : src ? changeLabel : emptyLabel}
	</Button>
{:else if layout === 'compact'}
	<div class="flex items-center gap-3">
		<button
			type="button"
			class={[
				'group bg-base-100 dark:bg-base-900 border-base-200 dark:border-base-700 hover:border-accent-400 text-base-400 dark:text-base-600 relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden border transition-colors',
				thumbClass,
				rounded,
				src ? '' : 'border-dashed'
			]}
			onclick={pick}
		>
			{#if src}
				<img class="absolute inset-0 size-full object-cover" {src} alt="" />
			{:else}
				{@render placeholderIcon('size-5')}
			{/if}
			{#if isBusy}
				<div class="absolute inset-0 flex items-center justify-center bg-black/40">
					<span class="text-[10px] font-medium text-white">…</span>
				</div>
			{/if}
		</button>
		<div class="flex flex-col items-start gap-1">
			<Button variant="secondary" size="sm" disabled={isBusy} onclick={pick}>
				{src ? changeLabel : emptyLabel}
			</Button>
			{#if src && removable}
				<Button variant="ghost" size="sm" class="text-rose-500" onclick={remove}>Remove</Button>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex flex-col gap-2">
		<button
			type="button"
			class={[
				'group bg-base-100 dark:bg-base-900 border-base-200 dark:border-base-700 hover:border-accent-400 relative w-full cursor-pointer overflow-hidden border transition-colors',
				aspect,
				rounded,
				src ? '' : 'border-dashed'
			]}
			onclick={pick}
		>
			{#if src}
				<img class="absolute inset-0 size-full object-cover" {src} alt="" />
				<div
					class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
				>
					<span class="text-sm font-medium text-white">{changeLabel}</span>
				</div>
			{:else}
				<div
					class="text-base-500 dark:text-base-400 flex h-full w-full flex-col items-center justify-center gap-2 p-4"
				>
					{@render placeholderIcon('size-7')}
					<span class="text-sm font-medium">{emptyLabel}</span>
				</div>
			{/if}

			{#if isBusy}
				<div class="absolute inset-0 flex items-center justify-center bg-black/40">
					<span class="text-xs font-medium text-white">Processing…</span>
				</div>
			{/if}
		</button>

		{#if src && removable}
			<Button variant="ghost" size="sm" class="self-start text-rose-500" onclick={remove}>
				Remove
			</Button>
		{/if}
	</div>
{/if}
