<script lang="ts">
	import { getStroke } from 'perfect-freehand';
	import type { ContentComponentProps } from '../../types';

	let { item = $bindable(), isEditing }: ContentComponentProps = $props();

	type Stroke = {
		points: [number, number, number][];
		size?: number;
	};

	function getStrokeOptions(size: number) {
		return { size, thinning: 0.5, smoothing: 0.5, streamline: 0.5 };
	}

	function getSvgPathFromStroke(stroke: number[][]): string {
		if (!stroke.length) return '';

		const d = stroke.reduce(
			(acc, [x0, y0], i, arr) => {
				const [x1, y1] = arr[(i + 1) % arr.length];
				acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
				return acc;
			},
			['M', ...stroke[0], 'Q'] as (string | number)[]
		);

		d.push('Z');
		return d.join(' ');
	}

	// Parse strokes from JSON string stored in cardData
	function parseStrokes(): Stroke[] {
		const strokesJson = item.cardData.strokesJson as string | undefined;
		if (!strokesJson) return [];
		try {
			return JSON.parse(strokesJson) as Stroke[];
		} catch {
			return [];
		}
	}

	let strokes = $derived(parseStrokes());
	let viewBox = $derived((item.cardData.viewBox as string) || '0 0 100 100');
</script>

<svg class="absolute inset-0 h-full w-full" {viewBox} preserveAspectRatio="xMidYMid meet">
	{#each strokes as stroke, index (index)}
		{@const pathData = getSvgPathFromStroke(
			getStroke(stroke.points, getStrokeOptions(stroke.size ?? 3))
		)}
		<path d={pathData} class="accent:fill-white fill-black dark:fill-white" />
	{/each}
</svg>
