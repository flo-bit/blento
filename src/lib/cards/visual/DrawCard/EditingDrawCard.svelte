<script lang="ts">
	import { getStroke } from 'perfect-freehand';
	import type { ContentComponentProps } from '../../types';

	let { item = $bindable(), isEditing }: ContentComponentProps = $props();

	type Stroke = {
		points: [number, number, number][];
		size?: number;
	};

	let currentStroke = $state<[number, number, number][]>([]);
	let isDrawing = $state(false);
	let svgElement: SVGSVGElement | undefined = $state();

	const strokeSizes = [4, 8, 16] as const;
	let strokeWidth = $derived((item.cardData.strokeWidth as number) ?? 1);

	function getStrokeOptions(size: number) {
		return { size, thinning: 0.5, smoothing: 0.5, streamline: 0.5 };
	}

	let isLocked = $derived(item.cardData?.locked ?? true);

	function toggleLock() {
		item.cardData.locked = !item.cardData.locked;
	}

	function setStrokeWidth(index: number) {
		item.cardData.strokeWidth = index;
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

	// Save strokes as JSON string to cardData
	function saveStrokes(strokes: Stroke[]) {
		item.cardData.strokesJson = JSON.stringify(strokes);
	}

	let strokes = $derived(parseStrokes());
	let viewBox = $derived((item.cardData.viewBox as string) || '0 0 100 100');

	function getPointerPosition(event: PointerEvent): [number, number, number] {
		if (!svgElement) return [0, 0, 0.5];
		const rect = svgElement.getBoundingClientRect();

		// Get the current viewBox dimensions
		const [, , vbWidth, vbHeight] = (item.cardData.viewBox as string)?.split(' ').map(Number) || [
			0, 0, 100, 100
		];

		// Calculate the scale and offset for xMidYMid meet
		const scaleX = rect.width / vbWidth;
		const scaleY = rect.height / vbHeight;
		const scale = Math.min(scaleX, scaleY); // "meet" uses the smaller scale

		// Calculate the actual rendered size of the viewBox content
		const renderedWidth = vbWidth * scale;
		const renderedHeight = vbHeight * scale;

		// Calculate centering offsets (xMid, yMid)
		const offsetX = (rect.width - renderedWidth) / 2;
		const offsetY = (rect.height - renderedHeight) / 2;

		// Map screen coordinates to viewBox coordinates, accounting for centering
		const x = ((event.clientX - rect.left - offsetX) / renderedWidth) * vbWidth;
		const y = ((event.clientY - rect.top - offsetY) / renderedHeight) * vbHeight;
		const pressure = event.pressure || 0.5;
		return [x, y, pressure];
	}

	function initViewBox() {
		if (!svgElement || item.cardData.viewBox) return;
		const rect = svgElement.getBoundingClientRect();
		item.cardData.viewBox = `0 0 ${Math.round(rect.width)} ${Math.round(rect.height)}`;
	}

	function handlePointerDown(event: PointerEvent) {
		isDrawing = true;
		initViewBox();
		const point = getPointerPosition(event);
		currentStroke = [point];
		(event.target as Element)?.setPointerCapture?.(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDrawing) return;
		const point = getPointerPosition(event);
		currentStroke = [...currentStroke, point];
	}

	function handlePointerUp(event: PointerEvent) {
		if (!isDrawing) return;
		isDrawing = false;
		if (currentStroke.length > 0) {
			const newStroke: Stroke = {
				points: currentStroke,
				size: strokeSizes[strokeWidth]
			};
			saveStrokes([...strokes, newStroke]);
		}
		currentStroke = [];
		(event.target as Element)?.releasePointerCapture?.(event.pointerId);
	}

	function clearStrokes() {
		saveStrokes([]);
		item.cardData.viewBox = '';
	}
</script>

<div class={['absolute inset-0', isLocked ? 'touch-none' : '']}>
	<svg
		bind:this={svgElement}
		class={[
			'absolute inset-0 h-full w-full',
			isLocked ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
		]}
		{viewBox}
		preserveAspectRatio="xMidYMid meet"
		onpointerdown={isLocked ? handlePointerDown : undefined}
		onpointermove={isLocked ? handlePointerMove : undefined}
		onpointerup={isLocked ? handlePointerUp : undefined}
		onpointerleave={isLocked ? handlePointerUp : undefined}
	>
		{#each strokes as stroke, index (index)}
			{@const pathData = getSvgPathFromStroke(
				getStroke(stroke.points, getStrokeOptions(stroke.size ?? 3))
			)}
			<path d={pathData} class="accent:fill-white fill-black dark:fill-white" />
		{/each}
		{#if currentStroke.length > 0}
			{@const pathData = getSvgPathFromStroke(
				getStroke(currentStroke, getStrokeOptions(strokeSizes[strokeWidth]))
			)}
			<path d={pathData} class="accent:fill-white fill-black dark:fill-white" />
		{/if}
	</svg>

	{#if !isLocked && strokes.length === 0}
		<div
			class="text-base-500 pointer-events-none absolute inset-0 flex items-center justify-center text-sm"
		>
			Lock to draw
		</div>
	{/if}

	<div class="absolute top-2 right-2 flex gap-1">
		{#if isLocked}
			<div class="bg-base-100/80 dark:bg-base-800/80 flex items-center gap-0.5 rounded-full px-1">
				{#each strokeSizes as size, index (size)}
					<button
						type="button"
						class={[
							'flex items-center justify-center rounded-full p-1.5',
							strokeWidth === index ? 'bg-accent-500 text-white' : ''
						]}
						onclick={() => setStrokeWidth(index)}
						aria-label={`Stroke size ${size}`}
					>
						<div
							class={[
								'rounded-full bg-current',
								index === 0 ? 'h-1.5 w-1.5' : index === 1 ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'
							]}
						></div>
					</button>
				{/each}
			</div>

			<button
				type="button"
				class="bg-base-100/80 dark:bg-base-800/80 rounded-full p-1.5"
				onclick={clearStrokes}
				aria-label="Clear drawing"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="3 6 5 6 21 6"></polyline>
					<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
					></path>
				</svg>
			</button>
		{/if}

		<button
			type="button"
			class={[
				'rounded-full p-1.5',
				isLocked
					? 'bg-accent-500 text-white'
					: 'bg-base-100/80 text-base-900 dark:bg-base-800/80 dark:text-base-50'
			]}
			onclick={toggleLock}
			aria-label={isLocked ? 'Unlock card' : 'Lock card to draw'}
		>
			{#if isLocked}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
					<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
					<path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
				</svg>
			{/if}
		</button>
	</div>
</div>
