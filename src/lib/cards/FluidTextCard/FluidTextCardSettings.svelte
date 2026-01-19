<script lang="ts">
	import type { Item } from '$lib/types';
	import type { ContentComponentProps } from '../types';
	import { ToggleGroup, ToggleGroupItem, Button, Input, Label } from '@foxui/core';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();

	const fontWeights = ['400', '500', '600', '700', '800', '900'] as const;
	const fontFamilies = [
		'Arial',
		'Helvetica',
		'Georgia',
		'Times New Roman',
		'Courier New',
		'monospace'
	] as const;

	const classes = 'size-8 min-w-8 text-xs cursor-pointer';
</script>

<div class="flex flex-col gap-3">
	<div>
		<Label class="mb-1 text-xs">Text</Label>
		<Input
			bind:value={item.cardData.text}
			placeholder="Enter text"
			class="w-full"
		/>
	</div>

	<div>
		<Label class="mb-1 text-xs">Font Weight</Label>
		<ToggleGroup
			type="single"
			bind:value={
				() => item.cardData.fontWeight ?? '900',
				(value) => {
					if (!value) return;
					item.cardData.fontWeight = value;
				}
			}
		>
			{#each fontWeights as weight (weight)}
				<ToggleGroupItem size="sm" value={weight} class={classes}>
					{weight}
				</ToggleGroupItem>
			{/each}
		</ToggleGroup>
	</div>

	<div>
		<Label class="mb-1 text-xs">Font Family</Label>
		<select
			class="w-full rounded-md border border-base-200 bg-base-50 px-2 py-1.5 text-sm dark:border-base-800 dark:bg-base-900"
			value={item.cardData.fontFamily ?? 'Arial'}
			onchange={(e) => {
				item.cardData.fontFamily = e.currentTarget.value;
			}}
		>
			{#each fontFamilies as font (font)}
				<option value={font}>{font}</option>
			{/each}
		</select>
	</div>

	<div>
		<Label class="mb-1 text-xs">Font Size ({Math.round((item.cardData.fontSize ?? 0.33) * 100)}%)</Label>
		<div class="flex items-center gap-2">
			<Button
				variant="ghost"
				size="sm"
				onclick={() => {
					item.cardData.fontSize = Math.max((item.cardData.fontSize ?? 0.33) - 0.05, 0.1);
				}}
				disabled={(item.cardData.fontSize ?? 0.33) <= 0.1}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M5 12h14" />
				</svg>
			</Button>
			<input
				type="range"
				min="0.1"
				max="0.8"
				step="0.01"
				value={item.cardData.fontSize ?? 0.33}
				oninput={(e) => {
					item.cardData.fontSize = parseFloat(e.currentTarget.value);
				}}
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-base-200 dark:bg-base-700"
			/>
			<Button
				variant="ghost"
				size="sm"
				onclick={() => {
					item.cardData.fontSize = Math.min((item.cardData.fontSize ?? 0.33) + 0.05, 0.8);
				}}
				disabled={(item.cardData.fontSize ?? 0.33) >= 0.8}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M5 12h14" />
					<path d="M12 5v14" />
				</svg>
			</Button>
		</div>
	</div>
</div>
