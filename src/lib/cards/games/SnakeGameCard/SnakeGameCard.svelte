<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		createSnakeGame,
		restartSnakeGame,
		setSnakeDirection,
		startSnakeGame,
		tickSnakeGame,
		type SnakeDirection,
		type SnakeGameState
	} from './snakeGame';

	const INITIAL_LENGTH = 3;
	const TICK_MS = 120;
	const TARGET_CELL_SIZE = 22;
	const MIN_COLS = 8;
	const MAX_COLS = 40;
	const MIN_ROWS = 8;
	const MAX_ROWS = 40;
	const SWIPE_THRESHOLD = 18;

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let tickTimer: ReturnType<typeof setInterval> | null = null;
	let accentColorProbe: HTMLSpanElement;
	let touchStartX = 0;
	let touchStartY = 0;
	let hasTouchStart = false;

	let isAccentMode = false;
	let isDarkMode = false;
	let isBaseOrTransparentCard = true;
	let accentFoodColor = '#ec4899';
	let state: SnakeGameState = createSnakeGame({ initialLength: INITIAL_LENGTH }, Math.random);

	type SnakePalette = {
		board: string;
		grid: string;
		snake: string;
		head: string;
		food: string;
	};

	function detectTheme() {
		if (!container) return;
		isAccentMode = container.closest('.accent') !== null;
		isDarkMode = container.closest('.dark') !== null && !container.closest('.light');
		isBaseOrTransparentCard = container.closest('.light') === null;
		if (accentColorProbe) {
			const computedColor = getComputedStyle(accentColorProbe).color;
			if (computedColor) {
				accentFoodColor = computedColor;
			}
		}
	}

	function getPalette(): SnakePalette {
		if (isAccentMode) {
			return {
				board: 'rgba(255, 255, 255, 0.24)',
				grid: 'rgba(0, 0, 0, 0.16)',
				snake: '#111111',
				head: '#000000',
				food: '#dc2626'
			};
		}

		if (isDarkMode) {
			return {
				board: 'rgba(255, 255, 255, 0.06)',
				grid: 'rgba(255, 255, 255, 0.12)',
				snake: '#e5e7eb',
				head: '#ffffff',
				food: isBaseOrTransparentCard ? accentFoodColor : '#f87171'
			};
		}

		return {
			board: 'rgba(0, 0, 0, 0.06)',
			grid: 'rgba(0, 0, 0, 0.12)',
			snake: '#1f2937',
			head: '#000000',
			food: isBaseOrTransparentCard ? accentFoodColor : '#ef4444'
		};
	}

	function stopTicking() {
		if (!tickTimer) return;
		clearInterval(tickTimer);
		tickTimer = null;
	}

	function runTick() {
		state = tickSnakeGame(state, Math.random);
		draw();
		if (state.phase === 'gameover') {
			stopTicking();
		}
	}

	function startTicking() {
		stopTicking();
		tickTimer = setInterval(runTick, TICK_MS);
	}

	function startGame() {
		if (state.phase !== 'idle') return;
		state = startSnakeGame(state);
		startTicking();
		container?.focus();
		draw();
	}

	function restartRound() {
		state = restartSnakeGame(state, Math.random);
		startTicking();
		container?.focus();
		draw();
	}

	function startOrRestart() {
		if (state.phase === 'idle') {
			startGame();
			return;
		}
		if (state.phase === 'gameover') {
			restartRound();
		}
	}

	function handleDirection(direction: SnakeDirection) {
		if (state.phase === 'idle') {
			state = startSnakeGame(state);
			startTicking();
		} else if (state.phase === 'gameover') {
			state = restartSnakeGame(state, Math.random);
			startTicking();
		}

		state = setSnakeDirection(state, direction);
		container?.focus();
		draw();
	}

	function handleKeyDown(e: KeyboardEvent) {
		switch (e.code) {
			case 'ArrowUp':
			case 'KeyW':
				e.preventDefault();
				handleDirection('up');
				break;
			case 'ArrowDown':
			case 'KeyS':
				e.preventDefault();
				handleDirection('down');
				break;
			case 'ArrowLeft':
			case 'KeyA':
				e.preventDefault();
				handleDirection('left');
				break;
			case 'ArrowRight':
			case 'KeyD':
				e.preventDefault();
				handleDirection('right');
				break;
			case 'Space':
			case 'Enter':
				e.preventDefault();
				startOrRestart();
				break;
			case 'KeyR':
				e.preventDefault();
				restartRound();
				break;
		}
	}

	function handleTouchStart(e: TouchEvent) {
		if (!e.touches.length) return;
		const touch = e.touches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
		hasTouchStart = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (state.phase === 'playing') {
			e.preventDefault();
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!hasTouchStart) return;
		hasTouchStart = false;

		if (state.phase === 'idle' || state.phase === 'gameover') {
			startOrRestart();
			return;
		}

		if (state.phase !== 'playing' || !e.changedTouches.length) return;

		const touch = e.changedTouches[0];
		const dx = touch.clientX - touchStartX;
		const dy = touch.clientY - touchStartY;

		if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) {
			return;
		}

		if (Math.abs(dx) > Math.abs(dy)) {
			handleDirection(dx > 0 ? 'right' : 'left');
		} else {
			handleDirection(dy > 0 ? 'down' : 'up');
		}
	}

	function calculateGridSize(width: number, height: number): { cols: number; rows: number } {
		return {
			cols: Math.max(MIN_COLS, Math.min(MAX_COLS, Math.round(width / TARGET_CELL_SIZE))),
			rows: Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.round(height / TARGET_CELL_SIZE)))
		};
	}

	function resizeCanvas() {
		if (!canvas || !ctx) return;
		const rect = canvas.getBoundingClientRect();
		if (!rect.width || !rect.height) return;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.floor(rect.width * dpr);
		canvas.height = Math.floor(rect.height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const { cols, rows } = calculateGridSize(rect.width, rect.height);
		if (cols !== state.cols || rows !== state.rows) {
			const wasPlaying = state.phase === 'playing';
			state = createSnakeGame({ cols, rows, initialLength: INITIAL_LENGTH }, Math.random);
			if (wasPlaying) {
				state = startSnakeGame(state);
				startTicking();
			}
		}

		draw();
	}

	function draw() {
		if (!ctx || !canvas) return;
		const context = ctx;

		detectTheme();
		const palette = getPalette();
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		if (!width || !height) return;

		context.clearRect(0, 0, width, height);

		const cellWidth = width / state.cols;
		const cellHeight = height / state.rows;
		const cellInset = Math.max(1, Math.floor(Math.min(cellWidth, cellHeight) * 0.12));

		context.fillStyle = palette.board;
		context.fillRect(0, 0, width, height);

		context.strokeStyle = palette.grid;
		context.lineWidth = 1;
		for (let i = 1; i < state.cols; i++) {
			const x = i * cellWidth;
			context.beginPath();
			context.moveTo(x, 0);
			context.lineTo(x, height);
			context.stroke();
		}
		for (let i = 1; i < state.rows; i++) {
			const y = i * cellHeight;
			context.beginPath();
			context.moveTo(0, y);
			context.lineTo(width, y);
			context.stroke();
		}

		const drawCell = (x: number, y: number, color: string) => {
			context.fillStyle = color;
			context.fillRect(
				x * cellWidth + cellInset,
				y * cellHeight + cellInset,
				Math.max(1, cellWidth - cellInset * 2),
				Math.max(1, cellHeight - cellInset * 2)
			);
		};

		if (state.food) {
			const centerX = (state.food.x + 0.5) * cellWidth;
			const centerY = (state.food.y + 0.5) * cellHeight;
			const radius = Math.max(2, Math.min(cellWidth, cellHeight) * 0.28);
			context.beginPath();
			context.fillStyle = palette.food;
			context.arc(centerX, centerY, radius, 0, Math.PI * 2);
			context.fill();
		}

		state.snake.forEach((segment, index) => {
			drawCell(segment.x, segment.y, index === 0 ? palette.head : palette.snake);
		});
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		detectTheme();
		resizeCanvas();

		resizeObserver = new ResizeObserver(() => {
			resizeCanvas();
		});
		resizeObserver.observe(canvas);
	});

	onDestroy(() => {
		stopTicking();
		resizeObserver?.disconnect();
		resizeObserver = null;
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={container}
	class="relative h-full w-full overflow-hidden p-2 outline-none"
	tabindex="0"
	role="application"
	aria-label="Snake game"
	onkeydown={handleKeyDown}
>
	<div class="relative h-full w-full overflow-hidden rounded-xl">
		<canvas
			bind:this={canvas}
			class="h-full w-full touch-none select-none"
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
		></canvas>

		<div
			class="text-base-800 dark:text-base-200 accent:text-base-900 pointer-events-none absolute top-2 left-2 font-mono text-xs font-bold"
		>
			SCORE {state.score}
		</div>

		{#if state.phase === 'idle' || state.phase === 'gameover'}
			<button
				type="button"
				onclick={startOrRestart}
				class="border-base-800 bg-base-100/80 text-base-800 hover:bg-base-800 hover:text-base-100 dark:border-base-200 dark:bg-base-800/80 dark:text-base-200 dark:hover:bg-base-200 dark:hover:text-base-800 accent:border-base-900 accent:bg-white/80 accent:text-base-900 accent:hover:bg-base-900 accent:hover:text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform cursor-pointer rounded-lg border-2 px-4 py-2 font-mono text-xs font-bold transition-colors"
			>
				{state.phase === 'gameover' ? 'PLAY AGAIN' : 'START'}
			</button>
		{/if}
	</div>

	<span
		bind:this={accentColorProbe}
		class="text-accent-500 pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
		aria-hidden="true">.</span
	>
</div>
