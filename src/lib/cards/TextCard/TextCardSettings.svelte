<script lang="ts">
	import type { Item } from '$lib/types';
	import type { ContentComponentProps } from '../types';
	import { ToggleGroup, ToggleGroupItem, Button } from '@foxui/core';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();

	const classes = 'size-8 min-w-8 [&_svg]:size-3 cursor-pointer';
</script>

<div class="flex flex-col gap-2">

	<ToggleGroup
		type="single"
		bind:value={
			() => {
				return item.cardData.verticalAlign ?? 'top';
			},
			(value) => {
				if (!value) return;
				item.cardData.verticalAlign = value;
			}
		}
	>
		<ToggleGroupItem size="sm" value="top" class={classes}
			><svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><rect width="6" height="16" x="4" y="6" rx="2" /><rect
					width="6"
					height="9"
					x="14"
					y="6"
					rx="2"
				/><path d="M22 2H2" /></svg
			>
		</ToggleGroupItem>
		<ToggleGroupItem size="sm" value="center" class={classes}
			><svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><rect width="10" height="6" x="7" y="9" rx="2" /><path d="M22 20H2" /><path
					d="M22 4H2"
				/></svg
			></ToggleGroupItem
		>
		<ToggleGroupItem size="sm" value="bottom" class={classes}
			><svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><rect width="14" height="6" x="5" y="12" rx="2" /><rect
					width="10"
					height="6"
					x="7"
					y="2"
					rx="2"
				/><path d="M2 22h20" /></svg
			></ToggleGroupItem
		>
	</ToggleGroup>
	
	<ToggleGroup
		type="single"
		bind:value={
			() => {
				return item.cardData.textAlign ?? 'left';
			},
			(value) => {
				if (!value) return;
				item.cardData.textAlign = value;
			}
		}
	>
		<ToggleGroupItem size="sm" value="left" class={classes}
			><svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M21 5H3" /><path d="M15 12H3" /><path d="M17 19H3" /></svg
			></ToggleGroupItem
		>
		<ToggleGroupItem size="sm" value="center" class={classes}
			><svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M21 5H3" /><path d="M17 12H7" /><path d="M19 19H5" /></svg
			></ToggleGroupItem
		>
		<ToggleGroupItem size="sm" value="right" class={classes}
			><svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M21 5H3" /><path d="M21 12H9" /><path d="M21 19H7" /></svg
			></ToggleGroupItem
		>
	</ToggleGroup>


	<div>
		<Button
			variant="ghost"
			onclick={() => {
				item.cardData.textSize = Math.max((item.cardData.textSize ?? 0) - 1, 0);
			}}
			disabled={(item.cardData.textSize ?? 0) < 1}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-aarrow-down-icon lucide-a-arrow-down"
				><path d="m14 12 4 4 4-4" /><path d="M18 16V7" /><path
					d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16"
				/><path d="M3.304 13h6.392" /></svg
			>
		</Button>
		<Button
			variant="ghost"
			onclick={() => {
				item.cardData.textSize = Math.min((item.cardData.textSize ?? 0) + 1, 5);
			}}
			disabled={(item.cardData.textSize ?? 0) > 4}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-aarrow-up-icon lucide-a-arrow-up"
				><path d="m14 11 4-4 4 4" /><path d="M18 16V7" /><path
					d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16"
				/><path d="M3.304 13h6.392" /></svg
			>
		</Button>
	</div>
</div>
