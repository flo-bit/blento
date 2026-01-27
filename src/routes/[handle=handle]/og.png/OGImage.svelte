<script lang="ts">
	import type { Item } from '$lib/types';

	interface Props {
		name: string;
		avatar: string | undefined;
		items: Array<Item>;
	}

	const { name, avatar, items }: Props = $props();

	const GRID_UNIT = 100;
	const GAP = 20;

	const colors = {
		red: '#ef4444',
		orange: '#f97316',
		amber: '#f59e0b',
		yellow: '#eab308',
		lime: '#84cc16',
		green: '#22c55e',
		emerald: '#10b981',
		teal: '#14b8a6',
		cyan: '#06b6d4',
		sky: '#0ea5e9',
		blue: '#3b82f6',
		indigo: '#6366f1',
		violet: '#8b5cf6',
		purple: '#a855f7',
		fuchsia: '#d946ef',
		pink: '#ec4899',
		rose: '#f43f5e'
	};

	function getTailwindColor(color: keyof typeof colors) {
		return colors[color];
	}

	function getColor(item: Item): string {
		if (item.color) {
			let twColor = getTailwindColor(item.color as any);
			return twColor ?? item.color;
		}
		if (item.cardData?.color) {
			let twColor = getTailwindColor(item.cardData?.color);
			return twColor ?? '#' + item.cardData.color;
		}
		return '#262626';
	}

	function getBoxStyle(
		item: { x: number; y: number; w: number; h: number },
		color: string
	): string {
		const x = item.x * GRID_UNIT + GAP / 2;
		const y = item.y * GRID_UNIT + GAP / 2;
		const w = item.w * GRID_UNIT - GAP;
		const h = item.h * GRID_UNIT - GAP;

		return `position: absolute; left: ${x + 300}px; top: ${y}px; width: ${w}px; height: ${h}px; background: ${color}; border-radius: 20px; margin: 40px; color: transparent;`;
	}
</script>

<div
	style="display: flex; width: 1200px; height: 630px; background: #171717; font-family: sans-serif;"
>
	<!-- Left profile section -->
	<div
		style="display: flex; flex-direction: column; width: 350px; padding: 40px; justify-content: center; align-items: center;"
	>
		{#if avatar}
			<img
				src={avatar}
				alt=""
				style="width: 150px; height: 150px; border-radius: 100px; object-fit: cover;"
			/>
		{:else}
			<div
				style="width: 100px; height: 100px; border-radius: 50px; background: #404040; display: flex; align-items: center; justify-content: center;"
			>
				<div style="color: #a3a3a3; font-size: 50px; font-weight: bold;">
					{name.charAt(0).toUpperCase()}
				</div>
			</div>
		{/if}
		<div
			style="color: white; font-size: 32px; font-weight: bold; margin-top: 16px; text-align: center; max-width: 270px; overflow: hidden; text-overflow: ellipsis;"
		>
			{name}
		</div>
	</div>

	<!-- Right grid section -->
	{#each items as item, i (i)}
		<div style={getBoxStyle(item, getColor(item))}>hello</div>
	{/each}
</div>
