<script lang="ts">
	import type { ContentComponentProps } from '../types';
	import { onMount, onDestroy } from 'svelte';

	let { item }: ContentComponentProps = $props();

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationId: number;
	let audioCtx: AudioContext | null = null;

	// Theme detection
	let isAccentMode = $state(false);
	let isDarkMode = $state(false);

	// Game state
	let gameState = $state<'idle' | 'playing' | 'gameover'>('idle');
	let score = $state(0);
	let lines = $state(0);
	let level = $state(1);

	// Line clear animation
	let clearingLines: number[] = [];
	let clearAnimationProgress = 0;
	let isClearingAnimation = false;
	const CLEAR_ANIMATION_DURATION = 200; // ms
	let clearAnimationStart = 0;

	// Grid settings
	const COLS = 10;
	const ROWS = 20;
	let cellSize = 20;

	// Color schemes for different modes
	const COLOR_SCHEMES = {
		light: {
			I: '#0891b2', // cyan-600
			O: '#ca8a04', // yellow-600
			T: '#9333ea', // purple-600
			S: '#16a34a', // green-600
			Z: '#dc2626', // red-600
			J: '#2563eb', // blue-600
			L: '#ea580c'  // orange-600
		},
		dark: {
			I: '#22d3ee', // cyan-400
			O: '#facc15', // yellow-400
			T: '#c084fc', // purple-400
			S: '#4ade80', // green-400
			Z: '#f87171', // red-400
			J: '#60a5fa', // blue-400
			L: '#fb923c'  // orange-400
		},
		accent: {
			I: '#164e63', // cyan-900
			O: '#713f12', // yellow-900
			T: '#581c87', // purple-900
			S: '#14532d', // green-900
			Z: '#7f1d1d', // red-900
			J: '#1e3a8a', // blue-900
			L: '#7c2d12'  // orange-900
		}
	};

	function getColorScheme() {
		if (isAccentMode) return COLOR_SCHEMES.accent;
		if (isDarkMode) return COLOR_SCHEMES.dark;
		return COLOR_SCHEMES.light;
	}

	// Tetromino definitions (each has rotations)
	const TETROMINOES = {
		I: { shape: [[1, 1, 1, 1]] },
		O: { shape: [[1, 1], [1, 1]] },
		T: { shape: [[0, 1, 0], [1, 1, 1]] },
		S: { shape: [[0, 1, 1], [1, 1, 0]] },
		Z: { shape: [[1, 1, 0], [0, 1, 1]] },
		J: { shape: [[1, 0, 0], [1, 1, 1]] },
		L: { shape: [[0, 0, 1], [1, 1, 1]] }
	};

	type TetrominoType = keyof typeof TETROMINOES;

	// Game grid - stores tetromino type for color lookup
	let grid: (TetrominoType | null)[][] = [];

	// Current piece
	let currentPiece: {
		type: TetrominoType;
		shape: number[][];
		x: number;
		y: number;
	} | null = null;

	let nextPiece: TetrominoType | null = null;

	function detectTheme() {
		if (!container) return;
		// Check if we're inside an accent card (has .accent class ancestor)
		isAccentMode = container.closest('.accent') !== null;
		// Check dark mode
		isDarkMode = container.closest('.dark') !== null && !container.closest('.light');
	}

	// Timing
	let lastDrop = 0;
	let dropInterval = 1000;

	// Audio functions
	function initAudio() {
		if (!audioCtx) {
			audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
		}
	}

	function playTone(frequency: number, duration: number, type: OscillatorType = 'square') {
		if (!audioCtx) return;
		try {
			const oscillator = audioCtx.createOscillator();
			const gainNode = audioCtx.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioCtx.destination);

			oscillator.frequency.value = frequency;
			oscillator.type = type;

			gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

			oscillator.start(audioCtx.currentTime);
			oscillator.stop(audioCtx.currentTime + duration);
		} catch (e) {
			// Audio not supported
		}
	}

	function playMove() {
		playTone(150, 0.05);
	}

	function playRotate() {
		playTone(300, 0.08);
	}

	function playDrop() {
		playTone(100, 0.15);
	}

	function playLineClear(count: number) {
		const baseFreq = 400;
		for (let i = 0; i < count; i++) {
			setTimeout(() => playTone(baseFreq + i * 100, 0.15, 'sine'), i * 80);
		}
	}

	function playGameOver() {
		playTone(200, 0.3, 'sawtooth');
		setTimeout(() => playTone(150, 0.3, 'sawtooth'), 200);
		setTimeout(() => playTone(100, 0.5, 'sawtooth'), 400);
	}

	// Initialize grid
	function initGrid() {
		grid = Array(ROWS)
			.fill(null)
			.map(() => Array(COLS).fill(null));
	}

	// Get random tetromino
	function randomTetromino(): TetrominoType {
		const types = Object.keys(TETROMINOES) as TetrominoType[];
		return types[Math.floor(Math.random() * types.length)];
	}

	// Spawn new piece
	function spawnPiece() {
		const type = nextPiece || randomTetromino();
		nextPiece = randomTetromino();

		const tetromino = TETROMINOES[type];
		currentPiece = {
			type,
			shape: tetromino.shape.map((row) => [...row]),
			x: Math.floor((COLS - tetromino.shape[0].length) / 2),
			y: 0
		};

		// Check if spawn position is blocked (game over)
		if (!isValidPosition(currentPiece.shape, currentPiece.x, currentPiece.y)) {
			gameState = 'gameover';
			playGameOver();
		}
	}

	// Check if position is valid
	function isValidPosition(shape: number[][], x: number, y: number): boolean {
		for (let row = 0; row < shape.length; row++) {
			for (let col = 0; col < shape[row].length; col++) {
				if (shape[row][col]) {
					const newX = x + col;
					const newY = y + row;

					if (newX < 0 || newX >= COLS || newY >= ROWS) {
						return false;
					}

					if (newY >= 0 && grid[newY][newX]) {
						return false;
					}
				}
			}
		}
		return true;
	}

	// Rotate piece
	function rotatePiece() {
		if (!currentPiece) return;

		const rotated: number[][] = [];
		const rows = currentPiece.shape.length;
		const cols = currentPiece.shape[0].length;

		for (let col = 0; col < cols; col++) {
			rotated[col] = [];
			for (let row = rows - 1; row >= 0; row--) {
				rotated[col][rows - 1 - row] = currentPiece.shape[row][col];
			}
		}

		// Try rotation, with wall kicks
		const kicks = [0, -1, 1, -2, 2];
		for (const kick of kicks) {
			if (isValidPosition(rotated, currentPiece.x + kick, currentPiece.y)) {
				currentPiece.shape = rotated;
				currentPiece.x += kick;
				playRotate();
				return;
			}
		}
	}

	// Move piece
	function movePiece(dx: number, dy: number): boolean {
		if (!currentPiece) return false;

		if (isValidPosition(currentPiece.shape, currentPiece.x + dx, currentPiece.y + dy)) {
			currentPiece.x += dx;
			currentPiece.y += dy;
			if (dx !== 0) playMove();
			return true;
		}
		return false;
	}

	// Lock piece to grid
	function lockPiece() {
		if (!currentPiece) return;

		for (let row = 0; row < currentPiece.shape.length; row++) {
			for (let col = 0; col < currentPiece.shape[row].length; col++) {
				if (currentPiece.shape[row][col]) {
					const gridY = currentPiece.y + row;
					const gridX = currentPiece.x + col;
					if (gridY >= 0) {
						grid[gridY][gridX] = currentPiece.type;
					}
				}
			}
		}

		playDrop();
		checkAndClearLines();
	}

	// Check for completed lines and start animation
	function checkAndClearLines() {
		// Find all completed lines
		clearingLines = [];
		for (let row = 0; row < ROWS; row++) {
			if (grid[row].every((cell) => cell !== null)) {
				clearingLines.push(row);
			}
		}

		if (clearingLines.length > 0) {
			// Start swoosh animation
			isClearingAnimation = true;
			clearAnimationStart = performance.now();
			clearAnimationProgress = 0;
			playLineClear(clearingLines.length);
		} else {
			spawnPiece();
		}
	}

	// Actually remove the cleared lines (called after animation)
	function finishLineClear() {
		const cleared = clearingLines.length;

		// Remove lines from bottom to top to maintain indices
		for (const row of [...clearingLines].sort((a, b) => b - a)) {
			grid.splice(row, 1);
			grid.unshift(Array(COLS).fill(null));
		}

		lines += cleared;
		// Scoring: 100, 300, 500, 800 for 1, 2, 3, 4 lines
		const points = [0, 100, 300, 500, 800];
		score += points[Math.min(cleared, 4)] * level;

		// Level up every 10 lines
		const newLevel = Math.floor(lines / 10) + 1;
		if (newLevel > level) {
			level = newLevel;
			dropInterval = Math.max(100, 1000 - (level - 1) * 100);
		}

		clearingLines = [];
		isClearingAnimation = false;
		spawnPiece();
	}

	// Hard drop
	function hardDrop() {
		if (!currentPiece) return;

		while (movePiece(0, 1)) {
			score += 2;
		}
		lockPiece();
	}

	// Handle keyboard input
	function handleKeyDown(e: KeyboardEvent) {
		if (gameState !== 'playing' || isClearingAnimation) {
			if (e.code === 'Space' || e.code === 'Enter') {
				e.preventDefault();
				if (gameState !== 'playing') startGame();
			}
			return;
		}

		switch (e.code) {
			case 'ArrowLeft':
			case 'KeyA':
				e.preventDefault();
				movePiece(-1, 0);
				break;
			case 'ArrowRight':
			case 'KeyD':
				e.preventDefault();
				movePiece(1, 0);
				break;
			case 'ArrowDown':
			case 'KeyS':
				e.preventDefault();
				if (movePiece(0, 1)) score += 1;
				break;
			case 'ArrowUp':
			case 'KeyW':
				e.preventDefault();
				rotatePiece();
				break;
			case 'Space':
				e.preventDefault();
				hardDrop();
				break;
		}
	}

	// Touch controls
	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchStart(e: TouchEvent) {
		if (gameState !== 'playing' || isClearingAnimation) {
			if (gameState !== 'playing') startGame();
			return;
		}
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		if (gameState !== 'playing' || isClearingAnimation) return;

		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;
		const dx = touchEndX - touchStartX;
		const dy = touchEndY - touchStartY;
		const threshold = 30;

		if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
			// Tap - rotate
			rotatePiece();
		} else if (Math.abs(dx) > Math.abs(dy)) {
			// Horizontal swipe
			if (dx > threshold) movePiece(1, 0);
			else if (dx < -threshold) movePiece(-1, 0);
		} else {
			// Vertical swipe
			if (dy > threshold * 2) hardDrop();
			else if (dy > threshold) movePiece(0, 1);
		}
	}

	function startGame() {
		detectTheme();
		initAudio();
		initGrid();
		score = 0;
		lines = 0;
		level = 1;
		dropInterval = 1000;
		clearingLines = [];
		isClearingAnimation = false;
		nextPiece = randomTetromino();
		spawnPiece();
		gameState = 'playing';
		lastDrop = performance.now();
	}

	function calculateSize() {
		if (!canvas) return;
		const container = canvas.parentElement;
		if (!container) return;

		const maxWidth = container.clientWidth - 80; // Reserve space for next piece
		const maxHeight = container.clientHeight - 40;

		cellSize = Math.floor(Math.min(maxWidth / COLS, maxHeight / ROWS));
		cellSize = Math.max(10, Math.min(30, cellSize));

		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
	}

	function drawBlock(x: number, y: number, color: string, size: number = cellSize) {
		if (!ctx) return;

		ctx.fillStyle = color;
		ctx.fillRect(x, y, size - 1, size - 1);

		// Highlight
		ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
		ctx.fillRect(x, y, size - 1, 3);
		ctx.fillRect(x, y, 3, size - 1);

		// Shadow
		ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
		ctx.fillRect(x + size - 4, y, 3, size - 1);
		ctx.fillRect(x, y + size - 4, size - 1, 3);
	}

	function gameLoop(timestamp: number) {
		if (!ctx || !canvas) {
			animationId = requestAnimationFrame(gameLoop);
			return;
		}

		const colors = getColorScheme();
		const textColor = isAccentMode ? '#1a1a1a' : (isDarkMode ? '#f5f5f5' : '#1a1a1a');
		const gridBgColor = isAccentMode ? 'rgba(0, 0, 0, 0.15)' : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)');
		const gridLineColor = isAccentMode ? 'rgba(0, 0, 0, 0.1)' : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)');

		const canvasWidth = canvas.width;
		const canvasHeight = canvas.height;

		// Clear canvas
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// Calculate grid position (centered with space for next piece on right)
		const gridWidth = COLS * cellSize;
		const gridHeight = ROWS * cellSize;
		const offsetX = Math.floor((canvasWidth - gridWidth - 60) / 2);
		const offsetY = Math.floor((canvasHeight - gridHeight) / 2);

		// Draw grid background
		ctx.fillStyle = gridBgColor;
		ctx.fillRect(offsetX, offsetY, gridWidth, gridHeight);

		// Draw grid lines
		ctx.strokeStyle = gridLineColor;
		ctx.lineWidth = 1;
		for (let i = 0; i <= COLS; i++) {
			ctx.beginPath();
			ctx.moveTo(offsetX + i * cellSize, offsetY);
			ctx.lineTo(offsetX + i * cellSize, offsetY + gridHeight);
			ctx.stroke();
		}
		for (let i = 0; i <= ROWS; i++) {
			ctx.beginPath();
			ctx.moveTo(offsetX, offsetY + i * cellSize);
			ctx.lineTo(offsetX + gridWidth, offsetY + i * cellSize);
			ctx.stroke();
		}

		// Handle line clear animation
		if (isClearingAnimation) {
			const elapsed = timestamp - clearAnimationStart;
			clearAnimationProgress = Math.min(1, elapsed / CLEAR_ANIMATION_DURATION);

			if (clearAnimationProgress >= 1) {
				finishLineClear();
			}
		}

		// Draw locked pieces
		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				const cellType = grid[row][col];
				if (cellType) {
					const cellColor = colors[cellType];

					// Check if this row is being cleared
					if (clearingLines.includes(row)) {
						// Swoosh animation: reveal from left to right
						const swooshX = clearAnimationProgress * COLS;
						if (col < swooshX) {
							// Draw white flash that fades
							const flashProgress = Math.max(0, 1 - (swooshX - col) / 3);
							const flashColor = isAccentMode ? `rgba(255, 255, 255, ${flashProgress * 0.9})` :
								(isDarkMode ? `rgba(255, 255, 255, ${flashProgress * 0.9})` : `rgba(255, 255, 255, ${flashProgress * 0.95})`);
							ctx.fillStyle = flashColor;
							ctx.fillRect(offsetX + col * cellSize, offsetY + row * cellSize, cellSize - 1, cellSize - 1);
						} else {
							drawBlock(offsetX + col * cellSize, offsetY + row * cellSize, cellColor);
						}
					} else {
						drawBlock(offsetX + col * cellSize, offsetY + row * cellSize, cellColor);
					}
				}
			}
		}

		// Draw swoosh leading edge glow
		if (isClearingAnimation && clearingLines.length > 0) {
			const swooshX = clearAnimationProgress * COLS;
			const glowCol = Math.floor(swooshX);

			if (glowCol < COLS) {
				for (const row of clearingLines) {
					// Draw bright leading edge
					const glowWidth = cellSize * 0.5;
					const gradient = ctx.createLinearGradient(
						offsetX + glowCol * cellSize, 0,
						offsetX + glowCol * cellSize + glowWidth, 0
					);
					const glowColor = isAccentMode ? 'rgba(255, 255, 255, 0.95)' :
						(isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 1)');
					gradient.addColorStop(0, glowColor);
					gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

					ctx.fillStyle = gradient;
					ctx.fillRect(offsetX + glowCol * cellSize, offsetY + row * cellSize, glowWidth, cellSize - 1);
				}
			}
		}

		// Game logic (pause during animation)
		if (gameState === 'playing' && currentPiece && !isClearingAnimation) {
			// Auto drop
			if (timestamp - lastDrop > dropInterval) {
				if (!movePiece(0, 1)) {
					lockPiece();
				}
				lastDrop = timestamp;
			}

			// Draw ghost piece
			const pieceColor = colors[currentPiece.type];
			let ghostY = currentPiece.y;
			while (isValidPosition(currentPiece.shape, currentPiece.x, ghostY + 1)) {
				ghostY++;
			}
			ctx.globalAlpha = 0.3;
			for (let row = 0; row < currentPiece.shape.length; row++) {
				for (let col = 0; col < currentPiece.shape[row].length; col++) {
					if (currentPiece.shape[row][col]) {
						drawBlock(
							offsetX + (currentPiece.x + col) * cellSize,
							offsetY + (ghostY + row) * cellSize,
							pieceColor
						);
					}
				}
			}
			ctx.globalAlpha = 1;

			// Draw current piece
			for (let row = 0; row < currentPiece.shape.length; row++) {
				for (let col = 0; col < currentPiece.shape[row].length; col++) {
					if (currentPiece.shape[row][col]) {
						drawBlock(
							offsetX + (currentPiece.x + col) * cellSize,
							offsetY + (currentPiece.y + row) * cellSize,
							pieceColor
						);
					}
				}
			}
		}

		// Draw next piece preview
		if (nextPiece && (gameState === 'playing' || isClearingAnimation)) {
			const nextTetromino = TETROMINOES[nextPiece];
			const previewX = offsetX + gridWidth + 10;
			const previewY = offsetY + 10;
			const previewSize = Math.floor(cellSize * 0.7);

			ctx.fillStyle = textColor;
			ctx.font = `bold ${Math.max(10, cellSize * 0.5)}px monospace`;
			ctx.textAlign = 'left';
			ctx.fillText('NEXT', previewX, previewY);

			const nextColor = colors[nextPiece];
			for (let row = 0; row < nextTetromino.shape.length; row++) {
				for (let col = 0; col < nextTetromino.shape[row].length; col++) {
					if (nextTetromino.shape[row][col]) {
						drawBlock(
							previewX + col * previewSize,
							previewY + 10 + row * previewSize,
							nextColor,
							previewSize
						);
					}
				}
			}
		}

		// Draw score
		ctx.fillStyle = textColor;
		ctx.font = `bold ${Math.max(10, cellSize * 0.6)}px monospace`;
		ctx.textAlign = 'left';

		const infoX = offsetX + gridWidth + 10;
		const infoY = offsetY + 80;

		if (gameState === 'playing' || gameState === 'gameover' || isClearingAnimation) {
			ctx.fillText(`${score}`, infoX, infoY);
			ctx.font = `${Math.max(8, cellSize * 0.4)}px monospace`;
			ctx.fillText(`LN ${lines}`, infoX, infoY + 15);
			ctx.fillText(`LV ${level}`, infoX, infoY + 28);
		}

		// Draw game over
		if (gameState === 'gameover') {
			ctx.fillStyle = textColor;
			ctx.font = `bold ${Math.max(12, cellSize * 0.8)}px monospace`;
			ctx.textAlign = 'center';
			ctx.fillText('GAME', offsetX + gridWidth / 2, offsetY + gridHeight / 2 - 10);
			ctx.fillText('OVER', offsetX + gridWidth / 2, offsetY + gridHeight / 2 + 15);
		}

		// Draw start screen with controls
		if (gameState === 'idle') {
			ctx.fillStyle = textColor;
			ctx.font = `bold ${Math.max(10, cellSize * 0.6)}px monospace`;
			ctx.textAlign = 'center';

			const centerX = canvasWidth / 2;
			const centerY = canvasHeight / 2;

			ctx.fillText('TETRIS', centerX, centerY - 40);

			ctx.font = `${Math.max(8, cellSize * 0.4)}px monospace`;
			ctx.fillText('\u2190\u2192 or A/D: Move', centerX, centerY - 10);
			ctx.fillText('\u2191 or W: Rotate', centerX, centerY + 8);
			ctx.fillText('\u2193 or S: Soft drop', centerX, centerY + 26);
			ctx.fillText('SPACE: Hard drop', centerX, centerY + 44);
		}

		animationId = requestAnimationFrame(gameLoop);
	}

	function resizeCanvas() {
		calculateSize();
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		detectTheme();
		calculateSize();
		initGrid();

		const resizeObserver = new ResizeObserver(() => {
			resizeCanvas();
		});
		resizeObserver.observe(canvas.parentElement!);

		animationId = requestAnimationFrame(gameLoop);

		return () => {
			resizeObserver.disconnect();
		};
	});

	onDestroy(() => {
		if (animationId) {
			cancelAnimationFrame(animationId);
		}
		if (audioCtx) {
			audioCtx.close();
		}
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

<div bind:this={container} class="relative h-full w-full overflow-hidden">
	<canvas
		bind:this={canvas}
		class="h-full w-full"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
	></canvas>

	{#if gameState === 'idle' || gameState === 'gameover'}
		<button
			onclick={startGame}
			class="absolute bottom-4 left-1/2 -translate-x-1/2 transform cursor-pointer rounded-lg border-2 border-base-800 bg-base-100/50 px-4 py-2 font-mono text-xs font-bold text-base-800 transition-colors hover:bg-base-800 hover:text-base-100 dark:border-base-200 dark:bg-base-800/50 dark:text-base-200 dark:hover:bg-base-200 dark:hover:text-base-800 accent:border-base-900 accent:bg-white/30 accent:text-base-900 accent:hover:bg-base-900 accent:hover:text-white"
		>
			{gameState === 'gameover' ? 'PLAY AGAIN' : 'START'}
		</button>
	{/if}
</div>
